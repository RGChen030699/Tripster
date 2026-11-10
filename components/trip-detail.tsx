export function TripDetail(_props: {
  trip: {
    id: string;
    name: string;
    destination: string;
    startDate: string;
    endDate: string;
    role: "organizer" | "member";
    members: { email: string; role: "organizer" | "member" }[];
  };
}) {
  return null;
}
