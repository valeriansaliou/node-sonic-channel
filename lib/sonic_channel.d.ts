// node-sonic-channel
// Copyright 2020, Valerian Saliou
// Author: spacemeowx2 <spacemeowx2@gmail.com>

export declare interface Options {
  host: string
  port: number
  auth?: string
  offlineStackMaxSize?: number
  emitQueueMaxSize?: number
}

export declare interface Handlers {
  connected?: () => void
  disconnected?: (error: any) => void
  timeout?: () => void
  retrying?: () => void
  error?: (error: any) => void
}

declare class Generic {
  constructor(options: Options)
  connect(handlers: Handlers): this
  ping(): Promise<void>
  close(): Promise<void>
}

export declare interface QueryOptions {
  limit?: number
  offset?: number
  lang?: string
}

export declare interface SuggestOptions {
  limit?: number
}

export declare interface ListOptions {
  limit?: number
  offset?: number
}

export declare interface PushOptions {
  lang?: string
}

export declare class Search extends Generic {
  query(collection: string, bucket: string, terms: string, options?: QueryOptions): Promise<string[]>
  suggest(collection: string, bucket: string, word: string, options?: SuggestOptions): Promise<string[]>
  list(collection: string, bucket: string, options?: ListOptions): Promise<string[]>
}

export declare class Ingest extends Generic {
  push(collection: string, bucket: string, object: string, text: string, options?: PushOptions): Promise<void>
  pop(collection: string, bucket: string, object: string, text: string): Promise<number>
  count(collection: string, bucket?: string, object?: string): Promise<number>
  flushc(collection: string): Promise<number>
  flushb(collection: string, bucket: string): Promise<number>
  flusho(collection: string, bucket: string, object: string): Promise<number>
}

export interface Info {
  clients_connected: number
  commands_total: number
  command_latency_best: number
  command_latency_worst: number
  kv_open_count: number
  fst_open_count: number
  fst_consolidate_count: number
}

export declare class Control extends Generic {
  trigger(action: string, data?: string): Promise<void>
  info(): Promise<Info>
}

export {}
