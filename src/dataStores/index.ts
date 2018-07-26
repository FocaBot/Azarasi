export interface IDataStore {
  /** Is the connection with the database active? */
  connected : boolean
  /** Is the database ready to accept queries? */
  ready : boolean

  /** Connect to the database backend */
  connect () : Promise<void>
  /** Ensure the database is ready to accept queries */
  ensureReady () : Promise<void> | Promise <{}>

  /** Gets an object by its key */
  get (key : string) : Promise<any>
  /** Sets the value of a key */
  set (key : string, val : any) : Promise<any>
  /** Deletes a key */
  del (key : string) : Promise<any>
  /** Subscribes to a key and listens for changes */
  subscribe (key : string, handler : SubscriptionHandler) : DataSubscription
}

/**
 * Handler for key subscriptions
 * Gets called each time the value of the key is updated
 * @param val - New value
 * @hidden
 */
export type SubscriptionHandler = (val : any) => void

/**
 * Data Subscription
 * @hidden
 */
export class DataSubscription {
  readonly key : string
  handler : SubscriptionHandler
  off? : () => void

  constructor (key : string, handler : SubscriptionHandler) {
    this.key = key
    this.handler = handler
  }
}
