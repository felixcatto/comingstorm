import { switchHttpMethod, validate } from '../../../lib/utils';
import { userLoginSchema } from '../../../models/User';

// export default function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method === 'POST') {
//     console.log(req.body);
//     res.status(200).json({ name: 'John Doe' });
//   } else {
//     res.status(404).json({ message: 'Not Found' });
//   }
// }

export default switchHttpMethod({
  post: [
    validate(userLoginSchema),
    (req, res) => {
      console.log(req.body);
      res.status(200).json({ name: 'John Doe' });
    },
  ],
});

// import { validate } from '../lib/utils';
// import encrypt from '../lib/secure';

// export default async app => {
//   const { User } = app.objection;

//   app.post(
//     '/session',
//     { name: 'session', preHandler: validate(User.yupLoginSchema) },
//     async (request, reply) => {
//       const user = await User.query().findOne('email', request.data.email);
//       if (!user) {
//         return reply.code(400).send({ errors: { email: 'User with such email not found' } });
//       }

//       if (user.password_digest !== encrypt(request.data.password)) {
//         return reply.code(400).send({ errors: { password: 'Wrong password' } });
//       }

//       request.session.set('userId', user.id);
//       return reply.send(user);
//     }
//   );

//   app.delete('/session', async (request, reply) => {
//     request.session.delete();
//     reply.code(201).send(User.guestUser);
//   });
// };
