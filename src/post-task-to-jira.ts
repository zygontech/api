export async function process({ task }: { task: Task }) {
  const jiraBaseUrl = await zygon.secrets.get("jiraBaseUrl"); // e.g., https://yourcompany.atlassian.net
  const jiraEmail = await zygon.secrets.get("jiraEmail"); // e.g., "bot@yourcompany.com"
  const jiraApiToken = await zygon.secrets.get("jiraApiToken"); // Atlassian API token
  const jiraProjectKey = await zygon.secrets.get("jiraProjectKey"); // e.g., "OPS"

  // Make the POST request to Jira REST API
  const response = await zygon.fetch({
    url: `${jiraBaseUrl}/rest/api/3/issue`,
    options: {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${jiraEmail}:${jiraApiToken}`)}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: {
        fields: {
          project: { key: jiraProjectKey },
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
