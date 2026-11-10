export function VoteControls({
  tripId,
  suggestionId,
  votes,
  myVote,
}: {
  tripId: string;
  suggestionId: string;
  votes: { yes: number; maybe: number; no: number };
  myVote: "yes" | "maybe" | "no" | null;
}) {
  void tripId;
  void suggestionId;
  void votes;
  void myVote;
  return null;
}
