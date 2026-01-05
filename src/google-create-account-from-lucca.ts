export async function process({ zygon, user }: { zygon: Zygon; user: User }) {
  // Exit early if the user does not have a Lucca ID
  if (!user.luccaUserId) return;

  // Fetch detailed user information from Lucca
  const luccaUser = await zygon.lucca.getUser({
    luccaUserId: user.luccaUserId.toString(),
  });

  // Skip processing if essential user fields are missing
  if (!luccaUser.mail || !luccaUser.firstName || !luccaUser.lastName) return;

  // Create a new Google account for this user using Lucca data
  await zygon.google.createUser({
    primaryEmail: luccaUser.mail,
    name: {
      givenName: luccaUser.firstName,
      familyName: luccaUser.lastName,
      fullName: `${luccaUser.firstName} ${luccaUser.lastName}`,
    },
    changePasswordAtNextLogin: true, // Force the user to set a new password on first login
    password: luccaUser.mail, // Temporary password (same as email for initial setup)
  });
}
