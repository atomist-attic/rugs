import { Issue } from "@atomist/cortex/Issue";
import { MessageMimeTypes, ResponseMessage } from "@atomist/rug/operations/Handlers";
import { renderError, renderSuccess } from "@atomist/slack-messages/RugMessages";
import deprecated from "deprecated-decorator";
import * as mustache from "mustache";

/*
 * Copyright © 2017 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// NOTE: plan is that this file can act as a facade for selecting
// rendering style for the message based on some context
// (MappedParameter, PE etc)

const listIssues = `{
  "attachments": [
    {{#issues}}
    {
      "fallback": "#{{number}}: {{{safeTitle}}}",
      {{#closed}}
      "footer_icon": "http://images.atomist.com/rug/issue-closed.png",
      "color": "#bd2c00",
      {{/closed}}
      {{^closed}}
      "footer_icon": "http://images.atomist.com/rug/issue-open.png",
      "color": "#6cc644",
      {{/closed}}
      {{#assignee}}
      "author_link": "{{{assignee.html_url}}}",
      "author_name": "@{{{assignee.login}}}",
      "author_icon": "{{{assignee.avatar_url}}}",
      {{/assignee}}
      "mrkdwn_in": ["text"],
      "text": "<{{{issueUrl}}}|#{{number}}: {{{safeTitle}}}>",
      "footer": "<{{{url}}}|{{{repo}}}>",
      "ts": "{{ts}}"
    }{{^last}}, {{/last}}
    {{/issues}}
  ]
}`;

/**
 * Render GitHub issues for slack.
 */
const renderIssues = deprecated({
    alternative: "@atomist/slack-messages",
    version: "1.0.0-m.5",
},
    function renderIssues(issuesList: Issue[], chatSystem?: string): ResponseMessage {
        const last = "last";
        try {
            issuesList[issuesList.length - 1][last] = true; // horrible mustache hack
            const msg = mustache.render(listIssues, {
                assignee() {
                    return this.assignee !== undefined;
                },
                closed() {
                    return this.state === "closed";
                },
                safeTitle() {
                    return JSON.stringify(this.title);
                },
                issues: issuesList,
            });
            return new ResponseMessage(msg, MessageMimeTypes.SLACK_JSON);
        } catch (ex) {
            return new ResponseMessage(`Error rendering issues ${ex}`);
        }

    });

export { renderIssues, renderError, renderSuccess };
