export async function process({ user }: { user: User }) {
  // Only suspend user if he has a valid 'googleId'
  if (!user.googleId) return;

  await zygon.google.updateUser({
    userKey: user.googleId,
    fields: {
      suspended: false,
    },
  });
}
