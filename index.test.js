const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');
const expect = chai.expect;
chai.use(sinonChai);

const czRedmineSmartCommit = require('./index.js');

describe('prompt for inputs', () => {
  it('should be a function',  () => {
    expect(czRedmineSmartCommit.prompter).to.be.a('function');
  });
});

describe('branch parser', () => {
  it('no valid input', () => {
    const response = czRedmineSmartCommit.branchParser('Invalid_Name');
    expect(response.length).to.eq(3);
    expect(response[0]).to.eq(undefined);
    expect(response[1]).to.eq(undefined);
    expect(response[2]).to.eq(undefined);
  });

  it('feat with message', () => {
    const response = czRedmineSmartCommit.branchParser('chore/test');
    expect(response.length).to.eq(3);
    expect(response[0]).to.eq("chore");
    expect(response[1]).to.eq(undefined);
    expect(response[2]).to.eq("test");
  });

  it('feat with redmine issue', () => {
    const response = czRedmineSmartCommit.branchParser('chore/102303');
    expect(response.length).to.eq(3);
    expect(response[0]).to.eq("chore");
    expect(response[1]).to.eq("102303");
    expect(response[2]).to.eq(undefined);
  });

  it('feat with jira issue', () => {
    const response = czRedmineSmartCommit.branchParser('chore/JIRA-102303');
    expect(response.length).to.eq(3);
    expect(response[0]).to.eq("chore");
    expect(response[1]).to.eq("JIRA-102303");
    expect(response[2]).to.eq(undefined);
  });

  it('feat with redmine issue and message', () => {
    const response = czRedmineSmartCommit.branchParser('chore/102303-abcd-pokus');
    expect(response.length).to.eq(3);
    expect(response[0]).to.eq("chore");
    expect(response[1]).to.eq("102303");
    expect(response[2]).to.eq("abcd-pokus");
  });

  it('feat with jira issue', () => {
    const response = czRedmineSmartCommit.branchParser('chore/JIRA-102303-nejaky_message');
    expect(response.length).to.eq(3);
    expect(response[0]).to.eq("chore");
    expect(response[1]).to.eq("JIRA-102303");
    expect(response[2]).to.eq("nejaky_message");
  });
})

describe('format commits', () => {
  const type = 'feat';
  const message = 'sample commit message';
  const issues = 'EIS-2030 EIS-20001';
  const target = ['BE', 'FE'];
  const description = 'This took waaaaay too long';

  it('should be a function', () => {
    expect(czRedmineSmartCommit.formatCommit).to.be.a('function');
  });

  it('should perform a full commit', () => {
    czRedmineSmartCommit.formatCommit((result) => {
      expect(result).to.equal('feat [EIS-2030 EIS-20001] BE,FE: sample commit message\n\nThis took waaaaay too long')
    }, {type, message, issues, target, description});
  });

  it('should commit without a issues', () => {
    czRedmineSmartCommit.formatCommit((result) => {
      expect(result).to.equal('feat BE,FE: sample commit message\n\nThis took waaaaay too long')
    }, {type, message, target, description});
  });

  it('should commit without target', () => {
    czRedmineSmartCommit.formatCommit((result) => {
      expect(result).to.equal('feat [EIS-2030 EIS-20001]: sample commit message\n\nThis took waaaaay too long')
    }, {type, message, issues, description});
  });

  it('should commit without description', () => {
    czRedmineSmartCommit.formatCommit((result) => {
      expect(result).to.equal('feat [EIS-2030 EIS-20001] BE,FE: sample commit message')
    }, {type, message, issues, target});
  });
});
