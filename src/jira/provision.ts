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

  const jiraBaseUrl = await zygon.variable.getByName({ name: "jiraBaseUrl" }); // e.g., https://yourcompany.atlassian.net
  const jiraEmail = await zygon.variable.getByName({ name: "jiraEmail" }); // e.g., "bot@yourcompany.com"
  const jiraApiToken = await zygon.variable.getByName({ name: "jiraApiToken" }); // Atlassian API token
  const jiraProjectKey = await zygon.variable.getByName({
    name: "jiraProjectKey",
  }); // e.g., "OPS"

  // Create a Jira issue for provisioning the user
  const response = await zygon.fetch({
    url: `${jiraBaseUrl.value}/rest/api/3/issue`,
    options: {
      method: "POST",
      headers: {
        Authorization: `Basic ${jiraEmail.value}:${jiraApiToken.value}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: {
        fields: {
          project: { key: jiraProjectKey.value },
          summary: `Provision access for ${target.fullName || target.primaryEmail} to ${app.name}`,
          description: {
            type: "doc",
            version: 1,
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: `Provision access request from Zygon.\n\nUser: ${target.fullName || target.primaryEmail}\nEmail: ${target.primaryEmail}\nApp: ${app.name}\nRoles: ${task.roles?.join(", ") || "N/A"}\nTask ID: ${task.id}`,
                  },
                ],
              },
            ],
          },
          issuetype: { name: "Task" },
          labels: ["zygon-sync", "provisioning"],
        },
      },
    },
  });

  if (!response.ok) {
    throw new Error(
      `Jira issue creation failed with status ${response.status}: ${response.statusText}`,
    );
  }
}
