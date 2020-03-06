const inquirer = require('inquirer');
const types = require('conventional-commit-types').types;
const map = require('lodash.map');
const longest = require('longest');
const rightPad = require('right-pad');
const branchName = require('current-git-branch');

// This can be any kind of SystemJS compatible module.
// We use Commonjs here, but ES6 or AMD would do just
// fine.
module.exports = {
  prompter: prompter,
  formatCommit: formatCommit,
  branchParser: defaults,
};

// Generate proper choices
var length = longest(Object.keys(types)).length + 1;
var choices = map(types, function(type, key) {
  return {
    name: rightPad(key + ':', length) + ' ' + type.description,
    value: key
  };
});

function undefinedWhenEmpty(str) {
  if (str && str.length > 0) {
    return str;
  } else {
    return undefined;
  }
}

// Return default values from current branch name.
function defaults(branch) {
  let defaultType = undefined;
  let defaultIssue = undefined;
  let defaultMessage = undefined;
  const slashIndex = branch.indexOf("/");

  if (slashIndex >= 0) {
    defaultType = branch.substr(0, slashIndex);
    defaultIssue = branch.substr(slashIndex + 1);

    // Parse "redmine" 203003 or "jira" JIRA-3040 like commits
    // and generate message line.
    const splitted = defaultIssue.split('-');

    if (splitted.length >= 2) {
      if (splitted[0].match(/^\d+$/)) { // Redmine issue just number
        defaultMessage = defaultIssue.substr(splitted[0].length + 1);
        defaultIssue = splitted[0];
      } else if (splitted[0].match(/^[a-zA-Z]+$/) && splitted[1].match(/^\d+$/)) { // Jira issue number +
        defaultMessage = defaultIssue.substr(splitted[0].length + splitted[1].length + 2)
        defaultIssue = splitted[0] + "-" + splitted[1];
      } else { // weird stuff
        defaultMessage = defaultIssue;
        defaultIssue = undefined;
      }
    } else {
      // This should be feat/303200 (just redmine issue) check that
      if (!defaultIssue.match(/^\d+$/)) {
        defaultMessage = defaultIssue;
        defaultIssue = undefined;
      }
    }
  }

  return [
    undefinedWhenEmpty(defaultType),
    undefinedWhenEmpty(defaultIssue),
    undefinedWhenEmpty(defaultMessage)
  ];
}

// When a user runs `git cz`, prompter will
// be executed. We pass you cz, which currently
// is just an instance of inquirer.js. Using
// this you can ask questions and get answers.
//
// The commit callback should be executed when
// you're ready to send back a commit template
// to git.
//
// By default, we'll de-indent your commit
// template and will keep empty lines.
function prompter(cz, commit) {
  const branch = branchName() || "";

  const [
    defaultType,
    defaultIssue,
    defaultMessage
  ] = defaults(branch);


  // Let's ask some questions of the user
  // so that we can populate our commit
  // template.
  //
  // See inquirer.js docs for specifics.
  // You can also opt to use another input
  // collection library if you prefer.
  inquirer.prompt([
    {
      type: 'list',
      name: 'type',
      message: "Select the type of change that you're committing:",
      choices: choices,
      default: defaultType,
    },
    {
      type: 'input',
      name: 'message',
      message: 'Commit message (required):\n',
      default: defaultMessage,
      validate: function(input) {
        if (!input) {
          return 'empty commit message';
        } else {
          return true;
        }
      }
    },
    {
      type: 'checkbox',
      name: 'target',
      message: 'FE/BE/CI (optional):\n',
      choices: [
        'BE', 'FE', 'CI',
      ],
    },
    {
      type: 'input',
      name: 'issues',
      message: 'Redmine Issue ID(s) (optional):\n',
      default: defaultIssue
    },
    {
      type: 'input',
      name: 'description',
      message: 'Description (optional):\n'
    },
  ]).then((answers) => {
    formatCommit(commit, answers);
  });
}

function formatCommit(commit, answers) {
  let message = answers.type;

  if (answers.issues) {
    message += ` [${answers.issues}]`
  }

  if (answers.target && answers.target.length && answers.target.length > 0) {
    message += ` ${answers.target.join(',')}`;
  }

  message += `: ${answers.message}`;

  if (answers.description && answers.description.length && answers.description.length > 0) {
    message += `\n\n${answers.description}`;
  }

  commit(message);
}
