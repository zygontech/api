export async function process({ user }: { user: User }) {
  const provisionableApps = await zygon.app.getByLabel({
    labelName: `birthright:${user.googleOrgUnitPath}`,
  });
  await zygon.account.provision({
    appInstanceIds: provisionableApps.map((app) => app.id),
    collaborators: [
      {
        id: user.id,
      },
    ],
  });
}
