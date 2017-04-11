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

import { Issue } from "@atomist/cortex/Issue";
import * as mustache from "mustache";
import { ResponseMessage, MessageMimeTypes } from "@atomist/rug/operations/Handlers"

const listIssues = `{
  "attachments": [
    {{#issues}}
    {
      "fallback": "#{{number}}: {{{title}}}",
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
      "text": "<{{{issueUrl}}}|#{{number}}: {{{title}}}>",
      "footer": "<{{{url}}}|{{{repo}}}>",
      "ts": "{{ts}}"
    }{{^last}}, {{/last}}
    {{/issues}}
  ]
}`;

/**
 * Render GitHub issues for slack.
 */
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
            issues: issuesList,
        });
        return new ResponseMessage(msg, MessageMimeTypes.SLACK_JSON)
    } catch (ex) {
        return new ResponseMessage(`Error rendering issues ${ex}`)
    }

}

const failure = `{
  "attachments": [
    {
      "fallback": "Unable to run command",
      "mrkdwn_in": ["text", "pretext"],
      "author_name": "Unable to run command",
      "author_icon": "https://images.atomist.com/rug/error-circle.png",
      {{#hasCorrelationId}}
      "footer": "Correlation ID: {{{corrid}}}",
      {{/hasCorrelationId}}
      "color": "#D94649",
      "text" : "{{{text}}}"
    }
  ]
}`;

/**
 * Generic error rendering.
 */
function renderError(msg: string, corrid?: string, chatSystem?: string): ResponseMessage {
    try {
        const slack = mustache.render(failure, {
            corrid,
            hasCorrelationId() {
                return this.corrid !== undefined;
            },
            text: msg,
        });
        return new ResponseMessage(slack, MessageMimeTypes.SLACK_JSON);
    } catch (ex) {
        return new ResponseMessage(`Error rendering error message ${ex}`)
    }

}

const success = `{
        "attachments": [
            {
                "fallback": "{{{text}}}",
                "mrkdwn_in": ["text", "pretext"],
                "author_name": "Successfully ran command",
                "author_icon": "https://images.atomist.com/rug/check-circle.gif?gif={{random}}",
                "color": "#45B254",
                "text": "{{{text}}}"
            }
        ]
    } `;

/**
 * Generic success rendering.
 */
function renderSuccess(msg: string, chatSystem?: string): ResponseMessage {
    try {
        const slack = mustache.render(success, { text: msg });
        return new ResponseMessage(slack, MessageMimeTypes.SLACK_JSON)
    } catch (ex) {
        return new ResponseMessage(`Error rendering success message ${ex}`)
    }

}

export { renderIssues, renderError, renderSuccess };
