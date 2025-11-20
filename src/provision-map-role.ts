export async function process({ account }: { account: Account }) {
  const user = await zygon.user.getById({ id: account.collaboratorId });
  // write your custom logic here to map roles
  const roles = user.role === "admin" ? ["admin"] : ["regular"];
  await zygon.account.update({ id: account.id, roles });
}
