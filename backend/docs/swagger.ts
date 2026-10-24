export const swaggerDocument = {
  openapi: '3.0.3',

  info: {
    title: 'DeploymentPlanner AI API',
    version: '1.0.0',
    description: 'Documentation REST API de DeploymentPlanner AI',
  },

  servers: [
    {
      url: 'http://localhost:4000',
      description: 'Serveur local',
    },
  ],

  tags: [
    { name: 'Health', description: 'Vérification du serveur' },
    { name: 'Authentication', description: 'Gestion des comptes utilisateurs' },
    { name: 'Projects', description: 'Gestion des projets de l’utilisateur connecté' },
  ],

  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Vérifier l’état du serveur',
        description: 'Retourne l’état opérationnel du backend.',
        responses: {
          '200': { description: 'Serveur opérationnel' },
          '503': { description: 'Service indisponible' },
        },
      },
    },

    '/api/v1/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Créer un compte utilisateur',
        description: 'Inscription d’un nouveau développeur.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterInput' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Compte créé avec succès',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RegisterResponse' },
              },
            },
          },
          '400': { description: 'Données invalides' },
          '409': { description: 'Adresse email déjà utilisée' },
        },
      },
    },

    '/api/v1/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Vérifier les identifiants',
        description:
          'Vérifie un email et un mot de passe. Ne crée pas encore de session.',
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
                    data: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          '400': { description: 'Données invalides' },
          '401': { description: 'Email ou mot de passe incorrect' },
          '403': { description: 'Compte désactivé' },
        },
      },
    },

    '/api/v1/auth/github': {
      get: {
        tags: ['Authentication'],
        summary: 'Se connecter avec GitHub',
        description: 'Démarre le flux OAuth et redirige vers GitHub.',
        responses: {
          '302': { description: 'Redirection vers GitHub' },
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
          { name: 'code', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'state', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '302': { description: 'Connexion réussie' },
          '400': { description: 'Callback OAuth invalide' },
          '409': { description: 'Compte local existant à lier' },
        },
      },
    },

    '/api/v1/projects': {
      post: {
        tags: ['Projects'],
        summary: 'Créer un projet',
        description:
          'Crée un projet pour l’utilisateur connecté. Le nom doit être unique parmi ses projets actifs.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateProjectInput' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Projet créé',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ProjectResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '409': { $ref: '#/components/responses/Conflict' },
        },
      },

      get: {
        tags: ['Projects'],
        summary: 'Lister mes projets',
        description: 'Retourne les projets de l’utilisateur connecté, du plus récent au plus ancien.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Liste des projets',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ProjectListResponse' },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },

    '/api/v1/projects/{id}': {
      get: {
        tags: ['Projects'],
        summary: 'Voir un projet',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/ProjectId' }],
        responses: {
          '200': {
            description: 'Projet trouvé',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ProjectResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },

      patch: {
        tags: ['Projects'],
        summary: 'Modifier un projet',
        description: 'Modifie le nom et/ou la description. Au moins un champ est requis.',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/ProjectId' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateProjectInput' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Projet mis à jour',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ProjectResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
          '409': { $ref: '#/components/responses/Conflict' },
        },
      },

      delete: {
        tags: ['Projects'],
        summary: 'Supprimer un projet',
        description:
          'Suppression logique (soft delete) : le nom redevient disponible.',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/ProjectId' }],
        responses: {
          '200': {
            description: 'Projet supprimé',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Project deleted successfully' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
  },

  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Jeton de session (JWT) envoyé dans l’en-tête Authorization: Bearer <jeton>.',
      },
    },

    parameters: {
      ProjectId: {
        name: 'id',
        in: 'path',
        required: true,
        description: 'Identifiant du projet (24 caractères hexadécimaux)',
        schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
        example: '507f1f77bcf86cd799439011',
      },
    },

    responses: {
      ValidationError: {
        description: 'Données invalides',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      Unauthorized: {
        description: 'Non authentifié ou session expirée',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      NotFound: {
        description: 'Projet introuvable (ou appartenant à un autre utilisateur)',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      Conflict: {
        description: 'Nom de projet déjà utilisé',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
    },

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
          id: { type: 'string', example: '507f1f77bcf86cd799439011' },
          name: { type: 'string', example: 'Ahmed Ben Ali' },
          email: { type: 'string', format: 'email', example: 'ahmed@example.com' },
          role: { type: 'string', example: 'DEVELOPER' },
        },
      },

      RegisterResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'User registered successfully' },
          data: { $ref: '#/components/schemas/User' },
        },
      },

      ErrorResponse: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'Invalid project data' },
              details: { type: 'object' },
            },
          },
        },
      },

      CreateProjectInput: {
        type: 'object',
        additionalProperties: false,
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 120, example: 'mon-api-node' },
          description: {
            type: 'string',
            maxLength: 1000,
            example: 'API Node.js à déployer sur Kubernetes',
          },
          environment: {
            type: 'string',
            description: 'Valeur de PROJECT_ENVIRONMENTS (défaut : DEVELOPMENT)',
            example: 'DEVELOPMENT',
          },
        },
      },

      UpdateProjectInput: {
        type: 'object',
        additionalProperties: false,
        minProperties: 1,
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 120, example: 'mon-api-node-v2' },
          description: { type: 'string', maxLength: 1000, example: 'Nouvelle description' },
        },
      },

      Project: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '507f1f77bcf86cd799439011' },
          owner: { type: 'string', example: '507f191e810c19729de860ea' },
          name: { type: 'string', example: 'mon-api-node' },
          description: { type: 'string', example: 'API Node.js à déployer sur Kubernetes' },
          environment: { type: 'string', example: 'DEVELOPMENT' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },

      ProjectResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Project created successfully' },
          data: { $ref: '#/components/schemas/Project' },
        },
      },

      ProjectListResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Projects retrieved successfully' },
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/Project' },
          },
        },
      },
    },
  },
} as const;