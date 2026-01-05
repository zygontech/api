export async function process({ zygon, task }: { zygon: Zygon; task: Task }) {
  const jiraBaseUrl = await zygon.variable.getByName({ name: "jiraBaseUrl" }); // e.g., https://yourcompany.atlassian.net
  const jiraEmail = await zygon.variable.getByName({ name: "jiraEmail" }); // e.g., "bot@yourcompany.com"
  const jiraApiToken = await zygon.variable.getByName({ name: "jiraApiToken" }); // Atlassian API token
  const jiraProjectKey = await zygon.variable.getByName({
    name: "jiraProjectKey",
  }); // e.g., "OPS"

  // Make the POST request to Jira REST API
  const response = await zygon.fetch({
    url: `${jiraBaseUrl.value}/rest/api/3/issue`,
    options: {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${jiraEmail.value}:${jiraApiToken.value}`)}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: {
        fields: {
          project: { key: jiraProjectKey.value },
          summary: task.title || `Zygon Task ${task.id}`,
          description: {
            type: "doc",
            version: 1,
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text:
                      task.description ||
                      `Created automatically from Zygon workflow.\nTask type: ${task.type}\nStatus: ${task.status}`,
                  },
                ],
              },
            ],
          },
          issuetype: { name: "Task" },
          labels: ["zygon-sync"],
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
