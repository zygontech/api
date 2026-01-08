/*
 * @param {Zygon} zygon - access to the Zygon API
 * @param {Task} task - Details of the matched task
 * @param {User} target - Details of the task target
 * @param {User} assignee - Details of the task assignee
 * @param {App} app - Details of the task app
 * @param {Doer} doer - Details of the doer
 */
export async function process({
  zygon,
  task,
  target,
  app,
}: {
  zygon: Zygon;
  task: Task;
  target?: User;
  assignee?: User;
  app?: App;
  doer: Doer;
}) {
  if (!target || !app) return;

  await zygon.google.createUser({
    appInstanceId: app.id,
    primaryEmail: target.primaryEmail,
    name: {
      givenName: "",
      familyName: "",
      fullName: target.fullName ?? "",
    },
    password: target.primaryEmail,
    changePasswordAtNextLogin: true,
  });

  await zygon.task.update({
    id: task.id,
    status: "Done",
  });
}
