export async function process({ zygon, user }: { zygon: Zygon; user: User }) {
  const provisionableApps = await zygon.app.getMany({
    labelNames: `birthright:${user.googleOrgUnitPath}`,
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
