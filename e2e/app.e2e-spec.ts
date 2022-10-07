import { JanusPage } from './app.po';

describe('janus App', () => {
  let page: JanusPage;

  beforeEach(() => {
    page = new JanusPage();
  });

  it('should display welcome messages', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!');
  });
});
