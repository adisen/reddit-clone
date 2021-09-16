import 'reflect-metadata'
import { MikroORM } from '@mikro-orm/core'
import { __prod__ } from './constants'
import microConfig from './mikro-orm.config'
import express from 'express'
import cors from 'cors'
import { ApolloServer } from 'apollo-server-express'
import { buildSchema } from 'type-graphql'
import redis from 'redis'
import session from 'express-session'
import connectRedis from 'connect-redis'
import { HelloResolver } from './resolvers/hello'
import { PostResolver } from './resolvers/post'
import { UserResolver } from './resolvers/user'

const main = async () => {
  const orm = await MikroORM.init(microConfig)
  await orm.getMigrator().up()

  const app = express()

  const RedisStore = connectRedis(session)
  const redisClient = redis.createClient()
  app.set('trust proxy', 1)
  app.use(cors({ origin: 'http://localhost:3000', credentials: true }))

  app.use(
    session({
      secret: 'qwepoiqwepoi',
      resave: false,
      saveUninitialized: false,
      name: 'qid',
      store: new RedisStore({ client: redisClient, disableTouch: true }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years,
        httpOnly: true,
        secure: __prod__, //cookie only works in https,
        sameSite: 'lax'
      }
    })
  )

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: true
    }),
    context: ({ req, res }) => ({ em: orm.em, req, res })
  })

  app.use('/graphql', express.json(), (req, _, next) => {
    req.session.userId = 1
    // console.log(req.session)
    return next()
  })

  await apolloServer.start()

  apolloServer.applyMiddleware({ app, cors: false })

  app.listen(4000, () => {
    console.log('Server started on port 4000')
  })
}

main().catch(err => {
  console.log(err)
})
