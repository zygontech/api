export async function process({ user }: { user: User }) {
  // Exit early if the user doesn't have a Lucca Manager ID
  if (!user.luccaManagerId) return;

  // Sync the Lucca Manager ID with the corresponding Zygon user
  await zygon.user.update({
    id: user.id,
    zygonManagerId: user.luccaManagerId,
  });
}
