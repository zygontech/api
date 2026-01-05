export async function process({ zygon, user }: { zygon: Zygon; user: User }) {
  if (!user.googleId || !user.googleOrgUnitPath) return;
  // Define the orgUnit to Google group email mapping
  const orgUnitToGroup = {
    "/Engineering": "engineering@mydomain.com",
    "/Product": "product@mydomain.com",
  } as any;
  // Check if the user org unit is managed
  if (!(user.googleOrgUnitPath in orgUnitToGroup)) return;
  // Assign user to the correct group
  await zygon.google.group.assign({
    googleUserId: user.googleId,
    groupIdentifier: orgUnitToGroup[user.googleOrgUnitPath],
  });
}
