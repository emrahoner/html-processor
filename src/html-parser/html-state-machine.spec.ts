import HtmlStateMachine from './html-state-machine'

describe('HtmlStateMachine', () => {
    let eventHandler: jest.Mock
    let stateMachine: HtmlStateMachine
    
    function parse(html: string) {
        stateMachine.reset()
        for(let char of html) {
            stateMachine.dispatch(char)
        }
        stateMachine.finish()
    }

    beforeEach(() => {
        eventHandler = jest.fn()

        stateMachine = new HtmlStateMachine()
        stateMachine.on('textCreated', (...args: any[]) => eventHandler('textCreated', ...args))
        stateMachine.on('elementStarted', (...args: any[]) => eventHandler('elementStarted', ...args))
        stateMachine.on('elementEnded', (...args: any[]) => eventHandler('elementEnded', ...args))
    })

    it('emits text created', () => {
        const html = 'gonna emit me'
        parse(html)

        expect(eventHandler).toHaveBeenCalledWith('textCreated',{ text: 'gonna emit me' })
        expect(eventHandler).toHaveBeenCalledTimes(1)
    })

    it('emits element started', () => {
        const html = '<myTag>'
        parse(html)

        expect(eventHandler).toHaveBeenCalledWith('elementStarted',{ tagName: 'MYTAG', attributes: [] })
        expect(eventHandler).toHaveBeenCalledTimes(1)
    })

    it('emits element ended', () => {
        const html = '</yourTag>'
        parse(html)

        expect(eventHandler).toHaveBeenCalledWith('elementEnded',{ tagName: 'YOURTAG' })
        expect(eventHandler).toHaveBeenCalledTimes(1)
    })

    it('emits element started for self closing elements', () => {
        const html = '<yourTag/>'
        parse(html)

        expect(eventHandler).toHaveBeenCalledWith('elementStarted',{ tagName: 'YOURTAG', attributes: [] })
        expect(eventHandler).toHaveBeenCalledTimes(1)
    })

    it('emits element started with attribute for self closing elements', () => {
        const html = '<yourTag/attr>'
        parse(html)

        expect(eventHandler).toHaveBeenCalledWith('elementStarted',{ tagName: 'YOURTAG', attributes: [{ name: 'attr', value: '' }] })
        expect(eventHandler).toHaveBeenCalledTimes(1)
    })

    it('emits element with valueless attribute', () => {
        const html = '<myTag  attr1>'
        parse(html)

        expect(eventHandler).toHaveBeenCalledWith(
            'elementStarted',
            {
                tagName: 'MYTAG',
                attributes: [
                    {
                        name: 'attr1',
                        value: ''
                    }
                ]
            })
    })

    it('emits element with attribute that has value with quotation', () => {
        const html = '<myTag  attr1  = "my attr value" >'
        parse(html)

        expect(eventHandler).toHaveBeenCalledWith(
            'elementStarted',
            {
                tagName: 'MYTAG',
                attributes: [
                    {
                        name: 'attr1',
                        value: 'my attr value'
                    }
                ]
            })
    })

    it('emits element with attribute that has value without quotation', () => {
        const html = '<myTag  attr1  = my attr value >'
        parse(html)

        expect(eventHandler).toHaveBeenCalledWith(
            'elementStarted',
            {
                tagName: 'MYTAG',
                attributes: [
                    {
                        name: 'attr1',
                        value: 'my'
                    },
                    {
                        name: 'attr',
                        value: ''
                    },
                    {
                        name: 'value',
                        value: ''
                    }
                ]
            })
    })

    it('emits element started with attributes', () => {
        const html = '<thatTag  attr1="value1" \t attr2  = \'value2 value3\' attr3 = value4   attr4 attr5 >'
        parse(html)

        expect(eventHandler).toHaveBeenCalledWith(
            'elementStarted',
            {
                tagName: 'THATTAG',
                attributes: [
                    {
                        name: 'attr1',
                        value: 'value1'
                    },
                    {
                        name: 'attr2',
                        value: 'value2 value3'
                    },
                    {
                        name: 'attr3',
                        value: 'value4'
                    },
                    {
                        name: 'attr4',
                        value: ''
                    },
                    {
                        name: 'attr5',
                        value: ''
                    }
                ] 
            })
        expect(eventHandler).toHaveBeenCalledTimes(1)
    })

    it('emits combination of element started and text created', () => {
        const html = 'R Y OK?<firstTag>life is so good<secondTag>nah, even better</thirdTag>'
        parse(html)

        expect(eventHandler).toHaveBeenNthCalledWith(1, 'textCreated',{ text: 'R Y OK?' })
        expect(eventHandler).toHaveBeenNthCalledWith(2, 'elementStarted',{ tagName: 'FIRSTTAG', attributes: [] })
        expect(eventHandler).toHaveBeenNthCalledWith(3, 'textCreated',{ text: 'life is so good' })
        expect(eventHandler).toHaveBeenNthCalledWith(4, 'elementStarted',{ tagName: 'SECONDTAG', attributes: [] })
        expect(eventHandler).toHaveBeenNthCalledWith(5, 'textCreated',{ text: 'nah, even better'  })
        expect(eventHandler).toHaveBeenNthCalledWith(6, 'elementEnded',{ tagName: 'THIRDTAG' })
        expect(eventHandler).toHaveBeenCalledTimes(6)
    })

    it('emits script with its inner text', () => {
        const html = `<script>
        var text = 'namber'
        <html>
        </html>
        </script
        </script>`
        parse(html)

        expect(eventHandler).toHaveBeenNthCalledWith(1, 'elementStarted',{ tagName: 'SCRIPT', attributes: [] })
        expect(eventHandler).toHaveBeenNthCalledWith(2, 'textCreated',{ text: `
        var text = 'namber'
        <html>
        </html>
        </script
        ` })
        expect(eventHandler).toHaveBeenNthCalledWith(3, 'elementEnded',{ tagName: 'SCRIPT' })
        expect(eventHandler).toHaveBeenCalledTimes(3)
    })

    it('emits style with its inner text', () => {
        const html = `my text<style type="text/css">
        .myStyle {
            backgrounf-color: #fff;
        }
        </style
        </style>`
        parse(html)

        expect(eventHandler).toHaveBeenNthCalledWith(1, 'textCreated',{ text: `my text` })
        expect(eventHandler).toHaveBeenNthCalledWith(2, 'elementStarted',{ tagName: 'STYLE', attributes: [{ name: 'type', value: 'text/css' }] })
        expect(eventHandler).toHaveBeenNthCalledWith(3, 'textCreated',{ text: `
        .myStyle {
            backgrounf-color: #fff;
        }
        </style
        ` })
        expect(eventHandler).toHaveBeenNthCalledWith(4, 'elementEnded',{ tagName: 'STYLE' })
        expect(eventHandler).toHaveBeenCalledTimes(4)
    })

    it('parses complex html without error', () => {
        const html = `
        <!DOCTYPE html>
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        <html class="hasSidebar hasPageActions hasBreadcrumb conceptual has-default-focus theme-light" lang="en-us" dir="ltr" data-css-variable-support="true" data-authenticated="false" data-auth-status-determined="false" data-target="docs" x-ms-format-detection="none">
        
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta property="og:title" content="Get started with ASP.NET Core" />
            <meta property="og:type" content="website" />
            <meta property="og:url" content="https://docs.microsoft.com/en-us/aspnet/core/getting-started/" />
                    <meta property="og:description" content="A short tutorial that creates and runs a basic Hello World app using ASP.NET Core." />
                <meta property="og:image" content="https://docs.microsoft.com/en-us/media/logos/logo-ms-social.png" />
                <meta property="og:image:alt" content="Microsoft Logo" />
        
            <meta name="twitter:card" content="summary" />
            <meta name="twitter:site" content="@docsmsft" />
        
        
            <meta name="author" content="Rick-Anderson" />
        <meta name="breadcrumb_path" content="/aspnet/core/breadcrumb/toc.json" />
        <meta name="depot_name" content="MSDN.aspnet-core-conceptual" />
        <meta name="description" content="A short tutorial that creates and runs a basic Hello World app using ASP.NET Core." />
        <meta name="document_id" content="ca6139d4-022c-395a-0abf-539660550df1" />
        <meta name="document_version_independent_id" content="3dd23f8a-300e-3f78-1dc5-8b759aabdccc" />
        <meta name="gitcommit" content="https://github.com/dotnet/AspNetCore.Docs/blob/23bd8d205726bf80904800f6e98a98fee8ea0bfa/aspnetcore/getting-started/index.md" />
        <meta name="locale" content="en-us" />
        <meta name="monikers" content="aspnetcore-1.0" />
        <meta name="monikers" content="aspnetcore-1.1" />
        <meta name="monikers" content="aspnetcore-2.0" />
        <meta name="monikers" content="aspnetcore-2.1" />
        <meta name="monikers" content="aspnetcore-2.2" />
        <meta name="monikers" content="aspnetcore-3.0" />
        <meta name="monikers" content="aspnetcore-3.1" />
        <meta name="monikers" content="aspnetcore-5.0" />
        <meta name="ms.author" content="riande" />
        <meta name="ms.custom" content="mvc" />
        <meta name="ms.date" content="01/07/2020" />
        <meta name="ms.prod" content="aspnet-core" />
        <meta name="ms.technology" content="aspnetcore-getstarted" />
        <meta name="ms.topic" content="tutorial" />
        <meta name="original_content_git_url" content="https://github.com/dotnet/AspNetCore.Docs/blob/live/aspnetcore/getting-started/index.md" />
        <meta name="search.ms_docsetname" content="aspnet-core-conceptual" />
        <meta name="search.ms_product" content="MSDN" />
        <meta name="search.ms_sitename" content="Docs" />
        <meta name="site_name" content="Docs" />
        <meta name="uhfHeaderId" content="MSDocsHeader-AspNet" />
        <meta name="uid" content="getting-started" />
        <meta name="updated_at" content="2020-08-19 09:10 PM" />
        <meta name="page_type" content="conceptual" />
        <meta name="toc_rel" content="../toc.json" />
        <meta name="pdf_url_template" content="https://docs.microsoft.com/pdfstore/en-us/MSDN.aspnet-core-conceptual/{branchName}{pdfName}" />
        <meta name="word_count" content="347" />
        
        
            <meta name="scope" content="ASP.NET Core" />
        <link href="https://docs.microsoft.com/en-us/aspnet/core/getting-started/" rel="canonical">
            <title>Get started with ASP.NET Core | Microsoft Docs</title>
        
                <link rel="stylesheet" href="/_themes/docs.theme/master/en-us/_themes/styles/284eaf13.site-ltr.css ">
        
            <link rel="stylesheet" href="/_themes/docs.theme/master/en-us/_themes/styles/2e5ce4ab.conceptual.css ">
        
        
            <script>
            var msDocs = {
                data: {
                    timeOrigin: Date.now(),
                    contentLocale: 'en-us',
                    contentDir: 'ltr',
                    userLocale: 'en-us',
                    userDir: 'ltr',
                    pageTemplate: 'Conceptual',
                    brand: '',
                    context: {
        
                    },
                    hasBinaryRating: true,
                    hasGithubIssues: true,
                    showFeedbackReport: false,
                    enableTutorialFeedback: false,
                    feedbackSystem: 'GitHub',
                    feedbackGitHubRepo: 'dotnet/AspNetCore.Docs',
                    feedbackProductUrl: 'https://github.com/dotnet/aspnetcore/blob/master/CONTRIBUTING.md',
                    contentGitUrl: 'https://github.com/dotnet/AspNetCore.Docs/blob/master/aspnetcore/getting-started/index.md',
                    extendBreadcrumb: true,
                    isEditDisplayable: true,
                    hideViewSource: false,
                    hasPageActions: true,
                    hasBookmark: true,
                    hasShare: true
                },
                functions:{}
            };
            </script>
            <script nomodule src="/static/third-party/bluebird/3.5.0/bluebird.min.js" integrity="sha384-aD4BDeDGeLXLpPK4yKeqtZQa9dv4a/7mQ+4L5vwshIYH1Mc2BrXvHd32iHzYCQy5" crossorigin="anonymous"></script>
            <script nomodule src="/static/third-party/fetch/3.0.0/fetch.umd.min.js" integrity="sha384-EQIXrC5K2+7X8nGgLkB995I0/6jfAvvyG1ieZ+WYGxgJHFMD/alsG9fSDWvzb5Y1" crossorigin="anonymous"></script>
            <script nomodule src="/static/third-party/template/1.4.0/template.min.js" integrity="sha384-1zKzI6ldTVHMU7n0W2HpE/lhHI+UG4D9IIaxbj3kT2UhCWicdTuJkTtnKuu0CQzN" crossorigin="anonymous"></script>
            <script nomodule src="/static/third-party/url/0.5.7/url.min.js" integrity="sha384-vn7xBMtpSTfzaTRWxj0kVq0UcsbBrTOgZ/M1ISHqe1V358elYva+lfiEC+T8jLPc" crossorigin="anonymous"></script>
            <script src="/_themes/docs.theme/master/en-us/_themes/scripts/7501e2bd.index-polyfills.js"></script>
                <script src="/_themes/docs.theme/master/en-us/_themes/scripts/5c9ead34.index-docs.js"></script>
        </head>
        
        <body lang="en-us" dir="ltr">
        <div class="header-holder has-default-focus">
            <a href="#main" class="skip-to-main-link has-outline-color-text visually-hidden-until-focused is-fixed has-inner-focus focus-visible has-top-zero has-left-zero has-right-zero has-padding-medium has-text-centered has-body-background-medium" tabindex="1">Skip to main content</a>
                <div id="headerAreaHolder" data-bi-name="header">
        <header role="banner" itemscope="itemscope" itemtype="http://schema.org/Organization">
            <div class="nav-bar">
                <div class="nav-bar-brand">
                    <a itemprop="url" href="https://www.microsoft.com" aria-label="Microsoft" class="nav-bar-button">
                        <div class="nav-bar-logo has-background-image theme-display is-light" role="presentation" aria-hidden="true" itemprop="logo" itemscope="itemscope"></div>
                        <div class="nav-bar-logo has-background-image theme-display is-dark is-high-contrast" role="presentation" aria-hidden="true" itemprop="logo" itemscope="itemscope"></div>
                    </a>
                </div>
            </div>
            <div class="nav-bar has-border-top is-hidden-mobile">
            </div>
        </header>		</div>
        
                        <div class="content-header uhf-container has-padding has-default-focus has-border-bottom-none" data-bi-name="content-header">
                        <nav class="has-padding-none has-padding-left-medium-tablet has-padding-right-medium-tablet has-padding-left-none-uhf-tablet has-padding-left-none-uhf-tablet has-padding-none-desktop has-flex-grow" data-bi-name="breadcrumb" itemscope itemtype="http://schema.org/BreadcrumbList" role="navigation" aria-label="Breadcrumb">
                            <ul id="page-breadcrumbs" class="breadcrumbs">
                            </ul>
                        </nav>
                    <div class="content-header-controls">
                        <button type="button" class="contents-button button" data-bi-name="contents-expand" aria-haspopup="true">
                            <span class="icon"><span class="docon docon-menu" aria-hidden="true"></span></span>
                            <span class="contents-expand-title">Contents</span>
                        </button>
                        <button type="button" class="ap-collapse-behavior ap-expanded button" data-bi-name="ap-collapse" aria-controls="action-panel">
                            <span class="icon"><span class="docon docon-exit-mode" aria-hidden="true"></span></span>
                            <span>Exit focus mode</span>
                        </button>
                    </div>
                    <div class="has-padding-none-tablet has-padding-medium is-size-small is-flex-touch has-flex-justify-content-space-between-touch has-flex-grow">
                        <ul class="is-hidden-mobile action-list has-flex-justify-content-start has-flex-justify-content-end-tablet is-flex is-flex-row has-flex-wrap has-flex-grow is-unstyled">
                            <li>
                                <button type="button" class="bookmark button is-text has-inner-focus is-small is-icon-only-touch" data-list-type="bookmarks" data-bi-name="bookmark" title="Bookmark this page">
                                    <span class="icon" aria-hidden="true">
                                        <span class="docon docon-single-bookmark"></span>
                                    </span>
                                    <span class="bookmark-status is-visually-hidden-touch is-hidden-portrait">Bookmark</span>
                                </button>
                            </li>
                                <li id="feedback-section-link">
                                    <a href="#feedback" class="button is-text has-inner-focus is-small is-icon-only-touch" data-bi-name="comments" title="Send feedback about this page">
                                        <span class="icon" aria-hidden="true">
                                            <span class="docon docon-comment-lines"></span>
                                        </span>
                                        <span class="is-visually-hidden-touch is-hidden-portrait">Feedback</span>
                                    </a>
                                </li>
                                    <li id="contenteditbtn">
                                        <a href="https://github.com/dotnet/AspNetCore.Docs/blob/master/aspnetcore/getting-started/index.md" class="button is-text has-inner-focus is-icon-only-touch is-small" title="Edit This Document" data-bi-name="edit" data-original_content_git_url="https://github.com/dotnet/AspNetCore.Docs/blob/live/aspnetcore/getting-started/index.md" data-original_content_git_url_template="{repo}/blob/{branch}/aspnetcore/getting-started/index.md" data-pr_repo="" data-pr_branch="">
                                        <span class="icon" aria-hidden="true">
                                            <span class="docon docon-edit-outline"></span>
                                        </span>
                                        <span class="is-visually-hidden-touch is-hidden-portrait">Edit</span>
                                    </a>
                                </li>
                            <li>
        <div class="sharing dropdown has-caret">
            <button class="dropdown-trigger button is-text is-fullwidth has-flex-justify-content-start has-inner-focus is-small is-icon-only-touch" aria-controls="sharing-menu" aria-expanded="false" title="Share This Document" data-bi-name="share">
                <span class="icon" aria-hidden="true">
                    <span class="docon docon-sharing"></span>
                </span>
                <span class="is-visually-hidden-touch is-hidden-portrait">Share</span>
            </button>
            <div class="dropdown-menu has-padding-small" id="sharing-menu">
                <ul data-bi-name="share-links">
                    <li>
                        <a class="button is-text is-fullwidth has-flex-justify-content-start has-inner-focus is-small share-twitter" data-bi-name="twitter">
                            <span class="icon">
                                <span class="docon docon-brand-twitter has-text-primary" aria-hidden="true"></span>
                            </span>
                            <span>Twitter</span>
                        </a>
                    </li>
                    <li>
                        <a class="button is-text is-fullwidth has-flex-justify-content-start has-inner-focus is-small share-linkedin" data-bi-name="linkedin">
                            <span class="icon">
                                <span class="docon docon-brand-linkedin has-text-primary" aria-hidden="true"></span>
                            </span>
                            <span>LinkedIn</span>
                        </a>
                    </li>
                    <li>
                        <a class="button is-text is-fullwidth has-flex-justify-content-start has-inner-focus is-small share-facebook" data-bi-name="facebook">
                            <span class="icon">
                                <span class="docon docon-brand-facebook has-text-primary" aria-hidden="true"></span>
                            </span>
                            <span>Facebook</span>
                        </a>
                    </li>
                    <li>
                        <a class="button is-text is-fullwidth has-flex-justify-content-start has-inner-focus is-small share-email" data-bi-name="email">
                            <span class="icon">
                                <span class="docon docon-mail-message-fill has-text-primary" aria-hidden="true"></span>
                            </span>
                            <span>Email</span>
                        </a>
                    </li>
                </ul>
            </div>
        </div>					</li>
                        </ul>
                        <button type="button" class="has-border contents-button button is-small is-text is-hidden-tablet has-inner-focus" aria-label="Contents" data-bi-name="contents-expand">
                            <span class="icon">
                                <span class="docon docon-editor-list-bullet" aria-hidden="true"></span>
                            </span>
                            <span class="contents-expand-title">Table of contents</span>
                        </button>
                        <div class="is-invisible"></div>
                        <div class="is-hidden-tablet level-item is-flexible level-right">
                            <button type="button" class="page-actions-button button is-small is-text is-hidden-tablet has-inner-focus has-border is-full-height  has-margin-left-small" aria-label="Page Actions" data-bi-name="pageactions">
                                <span class="icon">
                                    <span class="docon docon-more-vertical" aria-hidden="true"></span>
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
        
        
        
            <div id="disclaimer-holder" class="has-overflow-hidden has-default-focus"></div>
            </div>
        
            <div class="mainContainer  uhf-container has-top-padding  has-default-focus" data-bi-name="body">
        
                <div class="columns has-large-gaps is-gapless-mobile ">
        
                    <div id="left-container" class="left-container is-hidden-mobile column is-one-third-tablet is-one-quarter-desktop">
                        <nav id="affixed-left-container" class="is-fixed is-flex is-flex-column" role="navigation" aria-label="Primary"></nav>
                    </div>
        
                    <section class="primary-holder column is-two-thirds-tablet is-three-quarters-desktop">
                        <div class="columns is-gapless-mobile has-large-gaps ">
        
        
                        <div id="main-column" class="column  is-full is-four-fifths-desktop ">
        
                            <main id="main" role="main" class="content " data-bi-name="content" lang="en-us" dir="ltr">
        
        
        
                                <h1 id="tutorial-get-started-with-aspnet-core">Tutorial: Get started with ASP.NET Core</h1>
        
                                <ul class="metadata page-metadata" data-bi-name="page info" lang="en-us" dir="ltr">
                                    <li>
                                        <time class="is-invisible" data-article-date aria-label="Article review date" datetime="2020-01-07T00:00:00.000Z" data-article-date-source="ms.date">01/07/2020</time>
                                    </li>
                                        <li class="readingTime">2 minutes to read</li>
                                        <li class="contributors-holder">
                                            <a href="https://github.com/dotnet/AspNetCore.Docs/blob/master/aspnetcore/getting-started/index.md" title="13 Contributors" aria-label="13 Contributors">
                                                <ul class="contributors" data-bi-name="contributors" aria-hidden="true">
                                                            <li><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNMsAcAAQUAoVnxsV8AAAAASUVORK5CYII=" data-src="https://github.com/Rick-Anderson.png?size=32" role="presentation"/></li>
                                                            <li><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNMsAcAAQUAoVnxsV8AAAAASUVORK5CYII=" data-src="https://github.com/guardrex.png?size=32" role="presentation"/></li>
                                                            <li><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNMsAcAAQUAoVnxsV8AAAAASUVORK5CYII=" data-src="https://github.com/scottaddie.png?size=32" role="presentation"/></li>
                                                            <li><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNMsAcAAQUAoVnxsV8AAAAASUVORK5CYII=" data-src="https://github.com/mkArtakMSFT.png?size=32" role="presentation"/></li>
                                                            <li><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNMsAcAAQUAoVnxsV8AAAAASUVORK5CYII=" data-src="https://github.com/tdykstra.png?size=32" role="presentation"/></li>
                                                    <li><span class="is-size-extra-small has-text-subtle">+8</span></li>
                                                </ul>
                                            </a>
                                        </li>
                                </ul>
        
                                <nav id="center-doc-outline" class="doc-outline is-hidden-desktop" data-bi-name="intopic toc" role="navigation" aria-label="Article Outline">
                                    <h3>In this article</h3>
                                </nav>
        
                                <!-- <content> -->
                                    <p>This tutorial shows how to create and run an ASP.NET Core web app using the .NET Core CLI.</p>
        <p>You'll learn how to:</p>
        <div class="checklist">
        <ul>
        <li>Create a web app project.</li>
        <li>Trust the development certificate.</li>
        <li>Run the app.</li>
        <li>Edit a Razor page.</li>
        </ul>
        </div>
        <p>At the end, you'll have a working web app running on your local machine.</p>
        <p><img src="_static/home-page.png?view=aspnetcore-3.1" alt="Web app home page" data-linktype="relative-path"></p>
        <h2 id="prerequisites">Prerequisites</h2>
        <p><a href="https://dotnet.microsoft.com/download/dotnet-core/3.1" data-linktype="external">.NET Core 3.1 SDK or later</a></p>
        <h2 id="create-a-web-app-project">Create a web app project</h2>
        <p>Open a command shell, and enter the following command:</p>
        <pre><code class="lang-dotnetcli">dotnet new webapp -o aspnetcoreapp
        </code></pre>
        <p>The preceding command:</p>
        <ul>
        <li>Creates a new web app.</li>
        <li>The <code>-o aspnetcoreapp</code> parameter creates a directory named <em>aspnetcoreapp</em> with the source files for the app.</li>
        </ul>
        <h3 id="trust-the-development-certificate">Trust the development certificate</h3>
        <p>Trust the HTTPS development certificate:</p>
        <div class="tabGroup" id="tabgroup_CeZOj-G++Q">
        <ul role="tablist">
        <li role="presentation">
        <a href="#tabpanel_CeZOj-G++Q_windows" role="tab" aria-controls="tabpanel_CeZOj-G++Q_windows" data-tab="windows" tabindex="0" aria-selected="true" data-linktype="self-bookmark">Windows</a>
        </li>
        <li role="presentation">
        <a href="#tabpanel_CeZOj-G++Q_macos" role="tab" aria-controls="tabpanel_CeZOj-G++Q_macos" data-tab="macos" tabindex="-1" data-linktype="self-bookmark">macOS</a>
        </li>
        <li role="presentation">
        <a href="#tabpanel_CeZOj-G++Q_linux" role="tab" aria-controls="tabpanel_CeZOj-G++Q_linux" data-tab="linux" tabindex="-1" data-linktype="self-bookmark">Linux</a>
        </li>
        </ul>
        <section id="tabpanel_CeZOj-G++Q_windows" role="tabpanel" data-tab="windows">
        
        <pre><code class="lang-dotnetcli">dotnet dev-certs https --trust
        </code></pre>
        <p>The preceding command displays the following dialog:</p>
        <p><img src="_static/cert.png?view=aspnetcore-3.1" alt="Security warning dialog" data-linktype="relative-path"></p>
        <p>Select <strong>Yes</strong> if you agree to trust the development certificate.</p>
        </section>
        <section id="tabpanel_CeZOj-G++Q_macos" role="tabpanel" data-tab="macos" aria-hidden="true" hidden="hidden">
        
        <pre><code class="lang-dotnetcli">dotnet dev-certs https --trust
        </code></pre>
        <p>The preceding command displays the following message:</p>
        <p><em>Trusting the HTTPS development certificate was requested. If the certificate is not already trusted, we will run the following command:</em> <code>'sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain &lt;&lt;certificate&gt;&gt;'</code></p>
        <p>This command might prompt you for your password to install the certificate on the system keychain. Enter your password if you agree to trust the development certificate.</p>
        </section>
        <section id="tabpanel_CeZOj-G++Q_linux" role="tabpanel" data-tab="linux" aria-hidden="true" hidden="hidden">
        
        <p>See the documentation for your Linux distribution on how to trust the HTTPS development certificate.</p>
        </section>
        </div>
        
        <p>For more information, see <a href="../security/enforcing-ssl?view=aspnetcore-3.1#trust-the-aspnet-core-https-development-certificate-on-windows-and-macos" data-linktype="relative-path">Trust the ASP.NET Core HTTPS development certificate</a></p>
        <h2 id="run-the-app">Run the app</h2>
        <p>Run the following commands:</p>
        <pre><code class="lang-dotnetcli">cd aspnetcoreapp
        dotnet watch run
        </code></pre>
        <p>After the command shell indicates that the app has started, browse to <code>https://localhost:5001</code>.</p>
        <h2 id="edit-a-razor-page">Edit a Razor page</h2>
        <p>Open <em>Pages/Index.cshtml</em> and modify and save the page with the following highlighted markup:</p>
        <pre><code class="lang-cshtml" highlight-lines="9">@page
        @model IndexModel
        @{
            ViewData[&quot;Title&quot;] = &quot;Home page&quot;;
        }
        
        &lt;div class=&quot;text-center&quot;&gt;
            &lt;h1 class=&quot;display-4&quot;&gt;Welcome&lt;/h1&gt;
            &lt;p&gt;Hello, world! The time on the server is @DateTime.Now&lt;/p&gt;
        &lt;/div&gt;
        </code></pre>
        <p>Browse to <code>https://localhost:5001</code>, refresh the page, and verify the changes are displayed.</p>
        <h2 id="next-steps">Next steps</h2>
        <p>In this tutorial, you learned how to:</p>
        <div class="checklist">
        <ul>
        <li>Create a web app project.</li>
        <li>Trust the development certificate.</li>
        <li>Run the project.</li>
        <li>Make a change.</li>
        </ul>
        </div>
        <p>To learn more about ASP.NET Core, see the recommended learning path in the introduction:</p>
        <div class="nextstepaction">
        <p><a href="../introduction-to-aspnet-core?view=aspnetcore-3.1#recommended-learning-path" data-linktype="relative-path">Introduction to ASP.NET Core</a></p>
        </div>
        
                                <!-- </content> -->
        
                                </main>
        
                                <!-- page rating section -->
                                        <div class="is-hidden-desktop has-border-top has-margin-top-large has-padding-top-small">
                                            
                                            
        <div class="feedback-verbatim has-border-bottom has-padding-bottom-small has-margin-bottom-small" data-bi-name="rating">
            <div class="binary-rating">
                <div class="binary-rating-buttons">
                    <h3 class="has-text-weight-semibold has-margin-top-none has-margin-bottom-small">Is this page helpful?</h3>
                    <div>
                        <button class="thumb-rating like has-inner-focus has-padding-left-extra-small has-padding-right-extra-small" title="Yes" data-bi-name="rating-yes" aria-expanded="false" data-bi-sat="1" aria-controls="rating-container-mobile">
                            <span aria-hidden="true" class="icon docon docon-like"></span>
                            <span>Yes</span>
                        </button>
                        <button class="thumb-rating dislike has-inner-focus has-padding-none has-padding-right-extra-small" title="No" data-bi-name="rating-no" data-bi-sat="0" aria-expanded="false" aria-controls="rating-container-mobile">
                            <span aria-hidden="true" class="icon docon docon-dislike"></span>
                            <span>No</span>
                        </button>
                    </div>
                </div>
                <form class="feedback-verbatim-form is-hidden" id="rating-container-mobile">
                    <div class="verbatim-textarea box is-relative has-box-shadow-none has-border has-margin-top-small has-padding-extra-small is-size-extra-small">
                        <label for="rating-textarea-mobile" class="visually-hidden">Any additional feedback?</label>
                        <textarea id="rating-textarea-mobile" rows="4" maxlength="999" placeholder="Any additional feedback?" required class="textarea has-border-none has-box-shadow-none has-inner-focus"></textarea>
                    </div>
                    <div class="buttons is-right has-margin-top-medium has-margin-right-extra-small">
                        <button class="skip-rating button is-transparent has-text-primary is-small has-border-none" type="button">Skip</button>
                        <button class="submit-rating button is-primary is-small" data-bi-name="rating-verbatim" disabled type="submit">Submit</button>
                    </div>
                </form>
            </div>
            <div class="thankyou-rating is-hidden" tabindex="-1">
                <p>Thank you.</p>
            </div>
        </div>								</div>
                                <!-- end page rating section -->
        
        
                                <!-- feedback section -->
        <section class="feedback-section is-relative" data-bi-name="feedback-section">
        
            <h2 id="feedback" class="title is-3 has-margin-top-large">Feedback</h2>
        
            <div class="alert choose-feedback-type">
                <p aria-hidden="true" id="send-feedback-about">Submit and view feedback for</p>
        
                <div class="choose-feedback-buttons has-margin-top-medium">
                        <a class="button feedback-type-product has-margin-bottom-small" aria-label="Send feedback about this product" href="https://github.com/dotnet/aspnetcore/blob/master/CONTRIBUTING.md" data-bi-name="product-feedback">
                            <span>This product</span>
                            <span aria-hidden="true" class="icon docon docon-navigate-external is-size-h4 has-margin-left-none"></span>
                        </a>
        
                    <a class="button feedback-type-product has-margin-bottom-small github-link" aria-label="Send feedback about this page" data-bi-name="create-issue-on-github">
                        <span aria-hidden="true" class="docon docon-brand-github has-padding-right-extra-small"></span>
                        <span>This page</span>
                    </a>
                </div>
            </div>
        
            <div class="action-container is-flex has-flex-justify-content-end has-margin-top-small has-margin-bottom-small">
                <a class="view-on-github" data-bi-name="view-on-github" href="https://github.com/dotnet/AspNetCore.Docs/issues">
                    <span aria-hidden="true" class="docon docon-brand-github"></span>
                    <span>View all page feedback</span>
                    <span aria-hidden="true" class="icon docon docon-navigate-external is-size-h5"></span>
                </a>
            </div>
        </section>
        
                                <!-- end feedback section -->
        
                                <!-- feedback report section -->
                                <!-- end feedback report section -->
        
                                <div class="footerContainer is-visible-interactive has-default-focus ">
        
        
        
            <footer id="footer-interactive" data-bi-name="footer" class="footer-layout">
        
            <div class="is-flex is-full-height has-padding-right-extra-large-desktop">
                    <a data-mscc-ic="false" class="locale-selector-link has-flex-shrink-none" href="#" data-bi-name="select-locale"><span class="icon docon docon-world is-size-large has-margin-right-small" aria-hidden="true"></span><span class="local-selector-link-text"></span></a>
                <div class="has-margin-left-medium has-margin-right-medium has-flex-shrink-none">
        <div class="dropdown has-caret-up">
            <button class="dropdown-trigger button is-transparent is-small is-icon-only-touch has-inner-focus theme-dropdown-trigger"
                aria-controls="theme-menu-interactive" aria-expanded="false" title="Theme" data-bi-name="theme">
                <span class="icon">
                    <span class="docon docon-sun" aria-hidden="true"></span>
                </span>
                <span>Theme</span>
            </button>
            <div class="dropdown-menu" id="theme-menu-interactive" role="menu">
                <ul class="theme-selector has-padding-small">
                    <li class="theme is-block">
                        <button class="button is-text is-small theme-control is-fullwidth has-flex-justify-content-start"
                            data-theme-to="light">
                            <span class="theme-light has-margin-right-small">
                                <span
                                    class="theme-selector-icon css-variable-support has-border is-inline-block has-body-background"
                                    aria-hidden="true">
                                    <svg class="svg" xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 22 14">
                                        <rect width="22" height="14" class="has-fill-body-background" />
                                        <rect x="5" y="5" width="12" height="4" class="has-fill-secondary" />
                                        <rect x="5" y="2" width="2" height="1" class="has-fill-secondary" />
                                        <rect x="8" y="2" width="2" height="1" class="has-fill-secondary" />
                                        <rect x="11" y="2" width="3" height="1" class="has-fill-secondary" />
                                        <rect x="1" y="1" width="2" height="2" class="has-fill-secondary" />
                                        <rect x="5" y="10" width="7" height="2" rx="0.3" class="has-fill-primary" />
                                        <rect x="19" y="1" width="2" height="2" rx="1" class="has-fill-secondary" />
                                    </svg>
                                </span>
                            </span>
                            <span role="menuitem">
        Light					</span>
                        </button>
                    </li>
                    <li class="theme is-block">
                        <button class="button is-text is-small theme-control is-fullwidth has-flex-justify-content-start"
                            data-theme-to="dark">
                            <span class="theme-dark has-margin-right-small">
                                <span
                                    class="has-border theme-selector-icon css-variable-support is-inline-block has-body-background"
                                    aria-hidden="true">
                                    <svg class="svg" xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 22 14">
                                        <rect width="22" height="14" class="has-fill-body-background" />
                                        <rect x="5" y="5" width="12" height="4" class="has-fill-secondary" />
                                        <rect x="5" y="2" width="2" height="1" class="has-fill-secondary" />
                                        <rect x="8" y="2" width="2" height="1" class="has-fill-secondary" />
                                        <rect x="11" y="2" width="3" height="1" class="has-fill-secondary" />
                                        <rect x="1" y="1" width="2" height="2" class="has-fill-secondary" />
                                        <rect x="5" y="10" width="7" height="2" rx="0.3" class="has-fill-primary" />
                                        <rect x="19" y="1" width="2" height="2" rx="1" class="has-fill-secondary" />
                                    </svg>
                                </span>
                            </span>
                            <span role="menuitem">
        Dark					</span>
                        </button>
                    </li>
                    <li class="theme is-block">
                        <button class="button is-text is-small theme-control is-fullwidth has-flex-justify-content-start"
                            data-theme-to="high-contrast">
                            <span class="theme-high-contrast has-margin-right-small">
                                <span
                                    class="has-border theme-selector-icon css-variable-support is-inline-block has-body-background"
                                    aria-hidden="true">
                                    <svg class="svg" xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 22 14">
                                        <rect width="22" height="14" class="has-fill-body-background" />
                                        <rect x="5" y="5" width="12" height="4" class="has-fill-secondary" />
                                        <rect x="5" y="2" width="2" height="1" class="has-fill-secondary" />
                                        <rect x="8" y="2" width="2" height="1" class="has-fill-secondary" />
                                        <rect x="11" y="2" width="3" height="1" class="has-fill-secondary" />
                                        <rect x="1" y="1" width="2" height="2" class="has-fill-secondary" />
                                        <rect x="5" y="10" width="7" height="2" rx="0.3" class="has-fill-primary" />
                                        <rect x="19" y="1" width="2" height="2" rx="1" class="has-fill-secondary" />
                                    </svg>
                                </span>
                            </span>
                            <span role="menuitem">
        High contrast					</span>
                        </button>
                    </li>
                </ul>
            </div>
        </div>		</div>
            </div>
            <ul class="links" data-bi-name="footerlinks">
                    <li><a data-mscc-ic="false" href="https://docs.microsoft.com/en-us/previous-versions/" data-bi-name="archivelink">Previous Version Docs</a></li>
                    <li><a data-mscc-ic="false" href="https://docs.microsoft.com/en-us/teamblog" data-bi-name="bloglink">Blog</a></li>
                    <li><a data-mscc-ic="false" href="https://docs.microsoft.com/en-us/contribute" data-bi-name="contributorGuide">Contribute</a></li>
                        <li><a data-mscc-ic="false" href="https://go.microsoft.com/fwlink/?LinkId=521839" data-bi-name="privacy">Privacy &amp; Cookies</a></li>
                    <li><a data-mscc-ic="false" href="https://docs.microsoft.com/en-us/legal/termsofuse" data-bi-name="termsofuse">Terms of Use</a></li>
                        <li><a data-mscc-ic="false" href="https://aka.ms/sitefeedback" data-bi-name="feedback">Site Feedback</a></li>
                    <li><a data-mscc-ic="false" href="https://www.microsoft.com/en-us/legal/intellectualproperty/Trademarks/EN-US.aspx" data-bi-name="trademarks">Trademarks</a></li>
                <li>&copy; Microsoft 2020</li>
            </ul>
        </footer>
                                </div>
                            </div>
        
                            <div class="is-size-small right-container column is-one-quarter is-one-fifth-desktop is-hidden-mobile is-hidden-tablet-only" data-bi-name="pageactions" role="complementary" aria-label="Page Actions">
                                <div id="affixed-right-container" class="doc-outline is-fixed is-vertically-scrollable">
                                        
                                        
        <div class="feedback-verbatim has-border-bottom has-padding-bottom-small has-margin-bottom-small" data-bi-name="rating">
            <div class="binary-rating">
                <div class="binary-rating-buttons">
                    <h3 class="has-text-weight-semibold has-margin-top-none has-margin-bottom-small">Is this page helpful?</h3>
                    <div>
                        <button class="thumb-rating like has-inner-focus has-padding-left-extra-small has-padding-right-extra-small" title="Yes" data-bi-name="rating-yes" aria-expanded="false" data-bi-sat="1" aria-controls="rating-container-desktop">
                            <span aria-hidden="true" class="icon docon docon-like"></span>
                            <span>Yes</span>
                        </button>
                        <button class="thumb-rating dislike has-inner-focus has-padding-none has-padding-right-extra-small" title="No" data-bi-name="rating-no" data-bi-sat="0" aria-expanded="false" aria-controls="rating-container-desktop">
                            <span aria-hidden="true" class="icon docon docon-dislike"></span>
                            <span>No</span>
                        </button>
                    </div>
                </div>
                <form class="feedback-verbatim-form is-hidden" id="rating-container-desktop">
                    <div class="verbatim-textarea box is-relative has-box-shadow-none has-border has-margin-top-small has-padding-extra-small is-size-extra-small">
                        <label for="rating-textarea-desktop" class="visually-hidden">Any additional feedback?</label>
                        <textarea id="rating-textarea-desktop" rows="4" maxlength="999" placeholder="Any additional feedback?" required class="textarea has-border-none has-box-shadow-none has-inner-focus"></textarea>
                    </div>
                    <div class="buttons is-right has-margin-top-medium has-margin-right-extra-small">
                        <button class="skip-rating button is-transparent has-text-primary is-small has-border-none" type="button">Skip</button>
                        <button class="submit-rating button is-primary is-small" data-bi-name="rating-verbatim" disabled type="submit">Submit</button>
                    </div>
                </form>
            </div>
            <div class="thankyou-rating is-hidden" tabindex="-1">
                <p>Thank you.</p>
            </div>
        </div>							<nav id="side-doc-outline" data-bi-name="intopic toc" role="navigation" aria-label="Article Outline">
                                        <h3>In this article</h3>
                                    </nav>
                                </div>
                            </div>
        
                            <!--end of div.columns -->
                        </div>
        
                    <!--end of .primary-holder -->
                    </section>
        
                    <aside id="interactive-container" class="interactive-container is-visible-interactive column has-body-background-dark ">
                    </aside>
                </div>
        
                <!--end of .mainContainer -->
            </div>
        
            <div id="openFeedbackContainer" class="openfeedback-container"></div>
        
            <div class="footerContainer has-default-focus is-hidden-interactive ">
        
        
        
            <footer id="footer" data-bi-name="footer" class="footer-layout uhf-container has-padding" role="contentinfo">
        
            <div class="is-flex is-full-height has-padding-right-extra-large-desktop">
                    <a data-mscc-ic="false" class="locale-selector-link has-flex-shrink-none" href="#" data-bi-name="select-locale"><span class="icon docon docon-world is-size-large has-margin-right-small" aria-hidden="true"></span><span class="local-selector-link-text"></span></a>
                <div class="has-margin-left-medium has-margin-right-medium has-flex-shrink-none">
        <div class="dropdown has-caret-up">
            <button class="dropdown-trigger button is-transparent is-small is-icon-only-touch has-inner-focus theme-dropdown-trigger"
                aria-controls="theme-menu" aria-expanded="false" title="Theme" data-bi-name="theme">
                <span class="icon">
                    <span class="docon docon-sun" aria-hidden="true"></span>
                </span>
                <span>Theme</span>
            </button>
            <div class="dropdown-menu" id="theme-menu" role="menu">
                <ul class="theme-selector has-padding-small">
                    <li class="theme is-block">
                        <button class="button is-text is-small theme-control is-fullwidth has-flex-justify-content-start"
                            data-theme-to="light">
                            <span class="theme-light has-margin-right-small">
                                <span
                                    class="theme-selector-icon css-variable-support has-border is-inline-block has-body-background"
                                    aria-hidden="true">
                                    <svg class="svg" xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 22 14">
                                        <rect width="22" height="14" class="has-fill-body-background" />
                                        <rect x="5" y="5" width="12" height="4" class="has-fill-secondary" />
                                        <rect x="5" y="2" width="2" height="1" class="has-fill-secondary" />
                                        <rect x="8" y="2" width="2" height="1" class="has-fill-secondary" />
                                        <rect x="11" y="2" width="3" height="1" class="has-fill-secondary" />
                                        <rect x="1" y="1" width="2" height="2" class="has-fill-secondary" />
                                        <rect x="5" y="10" width="7" height="2" rx="0.3" class="has-fill-primary" />
                                        <rect x="19" y="1" width="2" height="2" rx="1" class="has-fill-secondary" />
                                    </svg>
                                </span>
                            </span>
                            <span role="menuitem">
        Light					</span>
                        </button>
                    </li>
                    <li class="theme is-block">
                        <button class="button is-text is-small theme-control is-fullwidth has-flex-justify-content-start"
                            data-theme-to="dark">
                            <span class="theme-dark has-margin-right-small">
                                <span
                                    class="has-border theme-selector-icon css-variable-support is-inline-block has-body-background"
                                    aria-hidden="true">
                                    <svg class="svg" xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 22 14">
                                        <rect width="22" height="14" class="has-fill-body-background" />
                                        <rect x="5" y="5" width="12" height="4" class="has-fill-secondary" />
                                        <rect x="5" y="2" width="2" height="1" class="has-fill-secondary" />
                                        <rect x="8" y="2" width="2" height="1" class="has-fill-secondary" />
                                        <rect x="11" y="2" width="3" height="1" class="has-fill-secondary" />
                                        <rect x="1" y="1" width="2" height="2" class="has-fill-secondary" />
                                        <rect x="5" y="10" width="7" height="2" rx="0.3" class="has-fill-primary" />
                                        <rect x="19" y="1" width="2" height="2" rx="1" class="has-fill-secondary" />
                                    </svg>
                                </span>
                            </span>
                            <span role="menuitem">
        Dark					</span>
                        </button>
                    </li>
                    <li class="theme is-block">
                        <button class="button is-text is-small theme-control is-fullwidth has-flex-justify-content-start"
                            data-theme-to="high-contrast">
                            <span class="theme-high-contrast has-margin-right-small">
                                <span
                                    class="has-border theme-selector-icon css-variable-support is-inline-block has-body-background"
                                    aria-hidden="true">
                                    <svg class="svg" xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 22 14">
                                        <rect width="22" height="14" class="has-fill-body-background" />
                                        <rect x="5" y="5" width="12" height="4" class="has-fill-secondary" />
                                        <rect x="5" y="2" width="2" height="1" class="has-fill-secondary" />
                                        <rect x="8" y="2" width="2" height="1" class="has-fill-secondary" />
                                        <rect x="11" y="2" width="3" height="1" class="has-fill-secondary" />
                                        <rect x="1" y="1" width="2" height="2" class="has-fill-secondary" />
                                        <rect x="5" y="10" width="7" height="2" rx="0.3" class="has-fill-primary" />
                                        <rect x="19" y="1" width="2" height="2" rx="1" class="has-fill-secondary" />
                                    </svg>
                                </span>
                            </span>
                            <span role="menuitem">
        High contrast					</span>
                        </button>
                    </li>
                </ul>
            </div>
        </div>		</div>
            </div>
            <ul class="links" data-bi-name="footerlinks">
                    <li><a data-mscc-ic="false" href="https://docs.microsoft.com/en-us/previous-versions/" data-bi-name="archivelink">Previous Version Docs</a></li>
                    <li><a data-mscc-ic="false" href="https://docs.microsoft.com/en-us/teamblog" data-bi-name="bloglink">Blog</a></li>
                    <li><a data-mscc-ic="false" href="https://docs.microsoft.com/en-us/contribute" data-bi-name="contributorGuide">Contribute</a></li>
                        <li><a data-mscc-ic="false" href="https://go.microsoft.com/fwlink/?LinkId=521839" data-bi-name="privacy">Privacy &amp; Cookies</a></li>
                    <li><a data-mscc-ic="false" href="https://docs.microsoft.com/en-us/legal/termsofuse" data-bi-name="termsofuse">Terms of Use</a></li>
                        <li><a data-mscc-ic="false" href="https://aka.ms/sitefeedback" data-bi-name="feedback">Site Feedback</a></li>
                    <li><a data-mscc-ic="false" href="https://www.microsoft.com/en-us/legal/intellectualproperty/Trademarks/EN-US.aspx" data-bi-name="trademarks">Trademarks</a></li>
                <li>&copy; Microsoft 2020</li>
            </ul>
        </footer>
            </div>
        
            <div id="action-panel" role="region" aria-label="Action Panel" class="action-panel has-default-focus" tabindex="-1"></div>
            <span id="adobe-target-experiment-container" hidden></span>
        </body>
        </html>
        `
        parse(html)

        expect(() => { parse(html) }).not.toThrow()
    })
})