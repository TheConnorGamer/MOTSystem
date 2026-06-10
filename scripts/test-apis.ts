import fs from "fs";
import path from "path";

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env");
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, "");
  }
}

loadEnv();

async function testDvsa(reg: string) {
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", process.env.DVSA_CLIENT_ID!);
  params.append("client_secret", process.env.DVSA_CLIENT_SECRET!);
  params.append("scope", process.env.DVSA_SCOPE!);

  const tokenRes = await fetch(process.env.DVSA_TOKEN_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  const tokenText = await tokenRes.text();
  console.log("DVSA token:", tokenRes.status, tokenText.slice(0, 300));
  if (!tokenRes.ok) return;

  const { access_token } = JSON.parse(tokenText);
  const cleanReg = reg.replace(/\s/g, "").toUpperCase();
  const url = `${process.env.DVSA_API_BASE}/v1/trade/vehicles/registration/${cleanReg}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${access_token}`,
      "x-api-key": process.env.DVSA_API_KEY!,
      Accept: "application/json",
    },
  });
  console.log("DVSA lookup", reg, ":", res.status);
  console.log((await res.text()).slice(0, 500));
}

async function testRapid(reg: string) {
  const cleanReg = reg.replace(/\s/g, "").toUpperCase();
  const res = await fetch(
    "https://uk-vehicle-data1.p.rapidapi.com/cartax.api.v1.Public/GetInitialReport",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-key": process.env.RAPIDAPI_KEY!,
        "x-rapidapi-host": "uk-vehicle-data1.p.rapidapi.com",
      },
      body: JSON.stringify({ vrm: cleanReg }),
    }
  );
  console.log("RapidAPI", reg, ":", res.status);
  console.log((await res.text()).slice(0, 800));
}

async function testAutoways(reg: string) {
  const cleanReg = reg.replace(/\s/g, "").toUpperCase();
  const url = new URL(
    "https://uk-vehicle-registration-api-british-vehicle-lookup.p.rapidapi.com/"
  );
  url.searchParams.set("plaque", cleanReg);
  const res = await fetch(url.toString(), {
    headers: {
      "x-rapidapi-key": process.env.RAPIDAPI_KEY!,
      "x-rapidapi-host":
        "uk-vehicle-registration-api-british-vehicle-lookup.p.rapidapi.com",
    },
  });
  console.log("Autoways", reg, ":", res.status);
  console.log((await res.text()).slice(0, 800));
}

async function testRegCheck(reg: string) {
  const cleanReg = reg.replace(/\s/g, "").toUpperCase();
  const url = `https://www.regcheck.org.uk/api/reg.asmx/Check?RegistrationNumber=${encodeURIComponent(cleanReg)}&username=${encodeURIComponent(process.env.REGCHECK_USERNAME!)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  console.log("RegCheck", reg, ":", res.status);
  console.log((await res.text()).slice(0, 500));
}

async function dumpDvsaMotTest(reg: string) {
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", process.env.DVSA_CLIENT_ID!);
  params.append("client_secret", process.env.DVSA_CLIENT_SECRET!);
  params.append("scope", process.env.DVSA_SCOPE!);
  const tokenRes = await fetch(process.env.DVSA_TOKEN_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  const { access_token } = await tokenRes.json();
  const cleanReg = reg.replace(/\s/g, "").toUpperCase();
  const res = await fetch(
    `${process.env.DVSA_API_BASE}/v1/trade/vehicles/registration/${cleanReg}`,
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
        "x-api-key": process.env.DVSA_API_KEY!,
      },
    }
  );
  const data = await res.json();
  console.log("First MOT test:", JSON.stringify(data.motTests?.[0], null, 2));
}

async function testLookupVehicle(reg: string) {
  const { lookupVehicle } = await import("../src/lib/dvsa");
  const result = await lookupVehicle(reg);
  console.log(
    "lookupVehicle",
    reg,
    ":",
    JSON.stringify(
      {
        registration: result.registration,
        make: result.make,
        model: result.model,
        motStatus: result.motStatus,
        motDueDate: result.motDueDate,
        motHistoryCount: result.motHistory.length,
        lastMotMileage: result.lastMotMileage,
      },
      null,
      2
    )
  );
}

async function main() {
  if (process.argv.includes("--lookup")) {
    await testLookupVehicle(process.argv[process.argv.length - 1]);
    return;
  }

  if (process.argv.includes("--dump-mot")) {
    await dumpDvsaMotTest(process.argv[process.argv.length - 1]);
    return;
  }

  const regs = process.argv.slice(2).length ? process.argv.slice(2) : ["BD51SMR", "AB12CDE"];

  for (const reg of regs) {
    console.log(`\n=== ${reg} ===`);
    await testDvsa(reg);
    await testRapid(reg);
    await testAutoways(reg);
    await testRegCheck(reg);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
