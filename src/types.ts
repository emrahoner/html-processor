export enum HtmlProcessTypes {
    AddAttribute = 'add-attribute',
    ClearScripts = 'clear-scripts'
}

export interface HtmlPipelineOption<TParam> {
    process: HtmlProcessTypes | string,
    params: TParam
}

export interface HtmlProcessor<TParam> {
    params: TParam
    process(document)
}