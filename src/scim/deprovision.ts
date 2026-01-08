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
  if (!app || !target) return;

  await zygon.scim.deprovision({
    appInstanceId: app.id,
    collaboratorId: target.id,
  });

  await zygon.task.update({
    id: task.id,
    status: "Done",
  });
}
