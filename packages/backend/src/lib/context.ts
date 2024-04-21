export class RequestContext<TData = unknown> {
  constructor(
    private props: {
      pathParams: PathParams
      body: Body
      queryParams: QueryParams
    },
    readonly data: TData,
    readonly result?: HandlerResult,
  ) {}

  get pathParams() {
    return this.props.pathParams
  }

  get body() {
    return this.props.body
  }

  get queryParams() {
    return this.props.queryParams
  }

  withData<NewData>(data: NewData) {
    return new RequestContext(this.props, { ...this.data, ...data })
  }

  withResult(result: HandlerResult) {
    return new RequestContext(this.props, this.data, result)
  }
}
export type RequestContextWithResult<TData> = RequestContext<TData> & {
  result: HandlerResult
}

export type PathParams = Partial<Record<string, string>>
export type Body = unknown
export type QueryParams = Partial<Record<string, string | string[]>>

export interface HandlerResult {
  statusCode: number
  value: unknown
}

export class RequestEnd<TData> {
  constructor(
    readonly context: RequestContext<TData>,
    readonly value: unknown,
  ) {}
}
