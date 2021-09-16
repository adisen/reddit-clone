import { IDatabaseDriver, Connection, EntityManager } from '@mikro-orm/core'
import { Request, Response } from 'express'
// import { Session, SessionData } from 'express-session'

declare module 'express-session' {
  interface SessionData {
    userId: number
  }
}

export type MyContext = {
  em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>
  req: Request & { session: { userId?: number | undefined } }
  res: Response
}
