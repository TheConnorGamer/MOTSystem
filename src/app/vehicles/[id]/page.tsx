import { VehicleProfile } from "@/components/vehicle-profile";

export default function VehiclePage({
  params,
}: {
  params: { id: string };
}) {
  return <VehicleProfile id={params.id} />;
}
