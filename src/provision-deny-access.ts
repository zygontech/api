export async function process({ account }: { account: Account }) {
  const user = await zygon.user.getById({ id: account.collaboratorId });
  if (user.googleOrgUnitPath !== "/Clevel") {
    // deleting the account to be provisioned to stop the provisioning
    await zygon.account.delete({ id: account.id });
    // notify admins
    const admins = await zygon.user.getByLabel({ labelName: "admins" });
    const app = await zygon.app.getById({ id: account.appInstanceId });
    await zygon.user.notify({
      userIds: admins.map((a) => a.id),
      subject: "access deny",
      message: `We deny access for ${user.primaryEmail} to app ${app.name}`,
    });
  }
}
