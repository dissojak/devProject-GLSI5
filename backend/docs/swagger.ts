
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
    {
      name: 'Admin - Users',
      description: 'Gestion des utilisateurs par un administrateur',
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
    summary: 'Connexion email avec JWT Bearer',
    description: 'Vérifie les identifiants et retourne un accessToken JWT pour le bouton Authorize.',

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
        description: 'Connexion réussie, jeton JWT émis',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/LoginResponse',
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
    summary: 'Connexion avec GitHub OAuth',
    description:
      'Démarre OAuth GitHub. ' +
      'Cette route doit être ouverte directement dans un navigateur. ' +
      'Ne pas utiliser Execute dans Swagger UI : ' +
      'la redirection vers GitHub peut provoquer une erreur CORS. ' +
      'Après autorisation, le callback retourne un JWT Bearer.',
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
      'Finalise GitHub OAuth et retourne un JWT Bearer signé par DeploymentPlanner AI. ' +
      'Le token OAuth GitHub reste côté serveur. La réponse contient accessToken, ' +
      'tokenType, expiresIn et le profil de l’utilisateur. ' +
      'Démarrer le flux via /api/v1/auth/github dans un navigateur; ' +
      'ne pas appeler manuellement le callback.',

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
      '200': {
        description: 'Authentification GitHub réussie',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/LoginResponse',
            },
            example: {
              message: 'GitHub authentication successful',
              data: {
                id: '507f1f77bcf86cd799439011',
                name: 'GitHub Developer',
                email: 'developer@example.com',
                role: 'DEVELOPER',
              },
              accessToken: 'eyJhbGciOiJIUzI1NiJ9...',
              tokenType: 'Bearer',
              expiresIn: 3600,
            },
          },
        },
      },

      '400': {
        description: 'OAuth state ou callback invalide',
      },

      '401': {
        description: 'Authentification refusée',
      },

      '409': {
        description: 'Compte existant nécessitant une liaison explicite',
      },
    },
  },
},


'/api/v1/admin/users': {
  get: {
    tags: ['Admin - Users'],
    summary: 'Lister les utilisateurs',
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'page',
        in: 'query',
        schema: { type: 'integer', minimum: 1, default: 1 },
      },
      {
        name: 'limit',
        in: 'query',
        schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
      },
      {
        name: 'q',
        in: 'query',
        schema: { type: 'string' },
      },
      {
        name: 'role',
        in: 'query',
        schema: { type: 'string', enum: ['ADMIN', 'DEVELOPER'] },
      },
      {
        name: 'includeDeleted',
        in: 'query',
        schema: { type: 'boolean' },
      },
    ],
    responses: {
      '200': { description: 'Liste paginée des utilisateurs' },
      '401': { description: 'Non authentifié' },
      '403': { description: 'Accès administrateur requis' },
    },
  },
},

'/api/v1/admin/users/{id}': {
  get: {
    tags: ['Admin - Users'],
    summary: 'Consulter un utilisateur',
    security: [{ bearerAuth: [] }],
    parameters: [{
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'string' },
    }],
    responses: {
      '200': { description: 'Utilisateur trouvé' },
      '401': { description: 'Non authentifié' },
      '403': { description: 'Accès interdit' },
      '404': { description: 'Utilisateur introuvable' },
    },
  },

  patch: {
    tags: ['Admin - Users'],
    summary: 'Modifier le nom d’un utilisateur',
    security: [{ bearerAuth: [] }],
    parameters: [{
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'string' },
    }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            additionalProperties: false,
            required: ['name'],
            properties: {
              name: { type: 'string', minLength: 2, maxLength: 100 },
            },
          },
        },
      },
    },
    responses: {
      '200': { description: 'Utilisateur modifié' },
      '400': { description: 'Données invalides' },
      '401': { description: 'Non authentifié' },
      '403': { description: 'Accès interdit' },
      '404': { description: 'Utilisateur introuvable' },
    },
  },
},

'/api/v1/admin/users/{id}/role': {
  patch: {
    tags: ['Admin - Users'],
    summary: 'Modifier le rôle d’un utilisateur',
    security: [{ bearerAuth: [] }],
    parameters: [{
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'string' },
    }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            additionalProperties: false,
            required: ['role'],
            properties: {
              role: {
                type: 'string',
                enum: ['ADMIN', 'DEVELOPER'],
              },
            },
          },
        },
      },
    },
    responses: {
      '200': { description: 'Rôle modifié' },
      '400': { description: 'Rôle invalide' },
      '401': { description: 'Non authentifié' },
      '403': { description: 'Accès interdit' },
      '404': { description: 'Utilisateur introuvable' },
    },
  },
},

'/api/v1/admin/users/{id}/deactivate': {
  post: {
    tags: ['Admin - Users'],
    summary: 'Désactiver un utilisateur',
    security: [{ bearerAuth: [] }],
    parameters: [{
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'string' },
    }],
    responses: {
      '200': { description: 'Utilisateur désactivé' },
      '401': { description: 'Non authentifié' },
      '403': { description: 'Accès interdit' },
      '404': { description: 'Utilisateur introuvable' },
      '409': { description: 'Transition impossible' },
    },
  },
},

'/api/v1/admin/users/{id}/reactivate': {
  post: {
    tags: ['Admin - Users'],
    summary: 'Réactiver un utilisateur',
    security: [{ bearerAuth: [] }],
    parameters: [{
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'string' },
    }],
    responses: {
      '200': { description: 'Utilisateur réactivé' },
      '401': { description: 'Non authentifié' },
      '403': { description: 'Accès interdit' },
      '404': { description: 'Utilisateur introuvable' },
      '409': { description: 'Transition impossible' },
    },
  },
},

'/api/v1/admin/users/pending': {
  get: {
    tags: ['Admin - Users'],
    summary: 'Lister les inscriptions en attente',
    security: [{ bearerAuth: [] }],
    responses: {
      '200': {
        description: 'Inscriptions en attente',
      },
      '401': {
        description: 'JWT manquant ou invalide',
      },
      '403': {
        description: 'Administrateur requis',
      },
    },
  },
},

'/api/v1/admin/users/{id}/approve': {
  post: {
    tags: ['Admin - Users'],
    summary: 'Approuver un développeur',
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' },
      },
    ],
    responses: {
      '200': {
        description: 'Développeur approuvé',
      },
      '401': {
        description: 'Non authentifié',
      },
      '403': {
        description: 'Accès interdit',
      },
      '404': {
        description: 'Utilisateur introuvable',
      },
      '409': {
        description: 'Transition de statut invalide',
      },
    },
  },
},

'/api/v1/admin/users/{id}/reject': {
  post: {
    tags: ['Admin - Users'],
    summary: 'Refuser une inscription',
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' },
      },
    ],
    responses: {
      '200': {
        description: 'Inscription refusée',
      },
      '401': {
        description: 'Non authentifié',
      },
      '403': {
        description: 'Accès interdit',
      },
      '404': {
        description: 'Utilisateur introuvable',
      },
      '409': {
        description: 'Transition de statut invalide',
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

      LoginResponse: {
        type: 'object',
        required: ['message', 'data', 'accessToken', 'tokenType', 'expiresIn'],
        properties: {
          message: { type: 'string', example: 'Login successful' },
          data: { $ref: '#/components/schemas/User' },
          accessToken: {
            type: 'string',
            description: 'JWT d’accès (ne pas consigner dans les logs)',
            example: 'eyJhbGciOiJIUzI1NiJ9...',
          },
          tokenType: { type: 'string', enum: ['Bearer'] },
          expiresIn: { type: 'integer', example: 3600 },
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
    securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description:
        'JWT applicatif obtenu après une connexion par email/mot de passe ' +
        'ou GitHub OAuth. Coller seulement accessToken dans Authorize, ' +
        'sans le préfixe Bearer.',
    },
  },
  },
} as const;
