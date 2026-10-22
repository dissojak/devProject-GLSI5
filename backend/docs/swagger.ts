
export const swaggerDocument = {
  openapi: '3.0.3',

  info: {
    title: 'DeploymentPlanner AI API',
    version: '1.0.0',
    description:
      'Documentation REST API de DeploymentPlanner AI',
  },

  servers: [
    {
      url: 'http://localhost:4000',
      description: 'Serveur local',
    },
  ],

  tags: [
    {
      name: 'Health',
      description: 'Vérification du serveur',
    },
    {
      name: 'Authentication',
      description: 'Gestion des comptes utilisateurs',
    },
  ],

  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Vérifier l’état du serveur',
        description:
          'Retourne l’état opérationnel du backend.',
        responses: {
          '200': {
            description: 'Serveur opérationnel',
          },
          '503': {
            description: 'Service indisponible',
          },
        },
      },
    },

    '/api/v1/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Créer un compte utilisateur',
        description:
          'Inscription d’un nouveau développeur.',

        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/RegisterInput',
              },
            },
          },
        },

        responses: {
          '201': {
            description: 'Compte créé avec succès',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/RegisterResponse',
                },
              },
            },
          },

          '400': {
            description: 'Données invalides',
          },

          '409': {
            description: 'Adresse email déjà utilisée',
          },
        },
      },
    },
    
    '/api/v1/auth/login': {
  post: {
    tags: ['Authentication'],
    summary: 'Vérifier les identifiants',
    description: 'Vérifie un email et un mot de passe. Ne crée pas encore de session.',

    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['email', 'password'],
            additionalProperties: false,
            properties: {
              email: {
                type: 'string',
                format: 'email',
                example: 'ahmed@example.com',
              },
              password: {
                type: 'string',
                format: 'password',
                example: 'Test@123456',
              },
            },
          },
        },
      },
    },

    responses: {
      '200': {
        description: 'Identifiants valides',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                data: {
                  $ref: '#/components/schemas/User',
                },
              },
            },
          },
        },
      },
      '400': {
        description: 'Données invalides',
      },
      '401': {
        description: 'Email ou mot de passe incorrect',
      },
      '403': {
        description: 'Compte désactivé',
      },
    },
  },
    },
    
'/api/v1/auth/github': {
  get: {
    tags: ['Authentication'],
    summary: 'Se connecter avec GitHub',
    description: 'Démarre le flux OAuth et redirige vers GitHub.',
    responses: {
      '302': {
        description: 'Redirection vers GitHub',
      },
    },
  },
},

'/api/v1/auth/github/callback': {
  get: {
    tags: ['Authentication'],
    summary: 'Callback GitHub OAuth',
    description:
      'Valide le retour GitHub, crée une session et redirige vers Next.js.',
    parameters: [
      {
        name: 'code',
        in: 'query',
        required: true,
        schema: { type: 'string' },
      },
      {
        name: 'state',
        in: 'query',
        required: true,
        schema: { type: 'string' },
      },
    ],
    responses: {
      '302': {
        description: 'Connexion réussie',
      },
      '400': {
        description: 'Callback OAuth invalide',
      },
      '409': {
        description: 'Compte local existant à lier',
      },
    },
  },
},
  },

  components: {
    schemas: {
      RegisterInput: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'email', 'password'],

        properties: {
          name: {
            type: 'string',
            minLength: 2,
            maxLength: 100,
            example: 'Ahmed Ben Ali',
          },

          email: {
            type: 'string',
            format: 'email',
            example: 'ahmed@example.com',
          },

          password: {
            type: 'string',
            format: 'password',
            minLength: 8,
            maxLength: 128,
            writeOnly: true,
            example: 'Test@123456',
          },
        },
      },

      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: '507f1f77bcf86cd799439011',
          },
          name: {
            type: 'string',
            example: 'Ahmed Ben Ali',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'ahmed@example.com',
          },
          role: {
            type: 'string',
            example: 'DEVELOPER',
          },
        },
      },

      RegisterResponse: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'User registered successfully',
          },
          data: {
            $ref: '#/components/schemas/User',
          },
        },
      },
    },
  },
} as const;
