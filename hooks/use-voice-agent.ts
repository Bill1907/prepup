import { useMutation } from "@tanstack/react-query";

export function useVoiceAgent() {
  const { mutate, isPending, error } = useMutation({
    mutationFn: () =>
      fetch("/api/ephemeral", { method: "POST" }).then((res) => res.json()),
    onSuccess: (data) => {
      console.log("Success", data);
    },
    onError: (error) => {
      console.error("Error", error);
    },
  });

  return { mutate, isPending, error };
}
