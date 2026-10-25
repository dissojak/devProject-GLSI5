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
        {
            name: 'Projects',
            description: 'Gestion des projets de l’utilisateur connecté',
        },
        {
            name: 'Profile',
            description: 'Profil et mot de passe de l’utilisateur connecté',
        },
    ],
    paths: {
        '/health': {
            get: {
                tags: ['Health'],
                summary: 'Vérifier l’état du serveur',
                description: 'Retourne l’état opérationnel du backend.',
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
                description: 'Inscription d’un nouveau développeur.',
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
                description: 'Démarre OAuth GitHub. ' +
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
                description: 'Finalise GitHub OAuth et retourne un JWT Bearer signé par DeploymentPlanner AI. ' +
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
        '/api/v1/profile': {
            get: {
                tags: ['Profile'],
                summary: 'Consulter mon profil',
                description: 'Retourne le profil de l’utilisateur connecté.',
                security: [{ bearerAuth: [] }],
                responses: {
                    '200': {
                        description: 'Profil de l’utilisateur connecté',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ProfileResponse' },
                            },
                        },
                    },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '403': { description: 'Compte désactivé ou non approuvé' },
                    '404': { $ref: '#/components/responses/NotFound' },
                },
            },
            patch: {
                tags: ['Profile'],
                summary: 'Modifier mon profil',
                description: 'Modifie le nom et/ou l’image de profil (URL https). ' +
                    'Envoyer avatarUrl à null supprime l’image. Au moins un champ est requis.',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/UpdateProfileInput' },
                        },
                    },
                },
                responses: {
                    '200': {
                        description: 'Profil mis à jour',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ProfileResponse' },
                            },
                        },
                    },
                    '400': { $ref: '#/components/responses/ValidationError' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '403': { description: 'Compte désactivé ou non approuvé' },
                    '404': { $ref: '#/components/responses/NotFound' },
                },
            },
        },
        '/api/v1/profile/password': {
            post: {
                tags: ['Profile'],
                summary: 'Changer mon mot de passe',
                description: 'Vérifie le mot de passe actuel puis enregistre le nouveau. ' +
                    'Les comptes GitHub sans mot de passe local reçoivent 403.',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ChangePasswordInput' },
                        },
                    },
                },
                responses: {
                    '200': {
                        description: 'Mot de passe modifié',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ChangePasswordResponse' },
                            },
                        },
                    },
                    '400': { $ref: '#/components/responses/ValidationError' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '403': {
                        description: 'Mot de passe actuel incorrect, compte sans mot de passe local ou compte désactivé',
                    },
                    '404': { $ref: '#/components/responses/NotFound' },
                },
            },
        },
        '/api/v1/projects': {
            post: {
                tags: ['Projects'],
                summary: 'Créer un projet',
                description: 'Crée un projet pour l’utilisateur connecté. Le nom doit être unique parmi ses projets actifs.',
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
                description: 'Suppression logique (soft delete) : le nom redevient disponible.',
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
        '/api/v1/projects/{id}/repository': {
            put: {
                tags: ['Projects'],
                summary: 'Lier un dépôt GitHub au projet',
                description: 'Enregistre le dépôt (URL + branche), puis le vérifie auprès de GitHub : ' +
                    'le dépôt doit être public et la branche doit exister. ' +
                    'Le résultat est stocké dans repository.isValid. ' +
                    'Appeler à nouveau pour remplacer le dépôt ou changer de branche.',
                security: [{ bearerAuth: [] }],
                parameters: [{ $ref: '#/components/parameters/ProjectId' }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ConnectRepositoryInput' },
                        },
                    },
                },
                responses: {
                    '200': {
                        description: 'Dépôt enregistré. data.repository.isValid à false signifie dépôt ou ' +
                            'branche introuvable (voir lastVerificationError).',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ProjectResponse' },
                            },
                        },
                    },
                    '400': { $ref: '#/components/responses/ValidationError' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '404': { $ref: '#/components/responses/NotFound' },
                    '500': { $ref: '#/components/responses/GithubUnavailable' },
                },
            },
        },
        '/api/v1/projects/{id}/repository/verify': {
            post: {
                tags: ['Projects'],
                summary: 'Revérifier le dépôt GitHub du projet',
                description: 'Interroge de nouveau GitHub (dépôt public, branche existante) et met à jour ' +
                    'repository.isValid. Sans dépôt lié, répond 404.',
                security: [{ bearerAuth: [] }],
                parameters: [{ $ref: '#/components/parameters/ProjectId' }],
                responses: {
                    '200': {
                        description: 'Vérification terminée',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ProjectResponse' },
                            },
                        },
                    },
                    '400': { $ref: '#/components/responses/ValidationError' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '404': { $ref: '#/components/responses/NotFound' },
                    '500': { $ref: '#/components/responses/GithubUnavailable' },
                },
            },
        },
    },
    components: {
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
                description: 'Ressource introuvable (ou n’appartenant pas à l’utilisateur courant)',
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
            GithubUnavailable: {
                description: 'Erreur technique côté GitHub (injoignable, quota atteint). ' +
                    'Le dépôt n’est pas modifié, réessayer plus tard.',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ErrorResponse' },
                        example: {
                            error: {
                                code: 'INVARIANT_VIOLATION',
                                message: 'GitHub rate limit reached, try again later',
                            },
                        },
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
            ConnectRepositoryInput: {
                type: 'object',
                additionalProperties: false,
                required: ['url', 'branch'],
                properties: {
                    url: {
                        type: 'string',
                        format: 'uri',
                        maxLength: 200,
                        example: 'https://github.com/octocat/Hello-World',
                    },
                    branch: {
                        type: 'string',
                        minLength: 1,
                        maxLength: 255,
                        pattern: '^[A-Za-z0-9._/-]+$',
                        example: 'master',
                    },
                },
            },
            RepositoryRef: {
                type: 'object',
                properties: {
                    provider: { type: 'string', example: 'github' },
                    owner: { type: 'string', example: 'octocat' },
                    name: { type: 'string', example: 'Hello-World' },
                    branch: { type: 'string', example: 'master' },
                    url: {
                        type: 'string',
                        format: 'uri',
                        description: 'Champ calculé par le modèle (virtual), jamais stocké',
                        example: 'https://github.com/octocat/Hello-World',
                    },
                    isValid: {
                        type: 'boolean',
                        description: 'true seulement si GitHub confirme le dépôt public et la branche',
                        example: true,
                    },
                    defaultBranch: { type: 'string', example: 'master' },
                    lastVerifiedAt: { type: 'string', format: 'date-time' },
                    lastVerificationError: { type: 'string', example: 'Branch "dev" not found' },
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
                    repository: { $ref: '#/components/schemas/RepositoryRef' },
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
            Profile: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: '507f1f77bcf86cd799439011' },
                    name: { type: 'string', example: 'Ahmed Ben Ali' },
                    email: { type: 'string', format: 'email', example: 'ahmed@example.com' },
                    role: { type: 'string', example: 'DEVELOPER' },
                    avatarUrl: {
                        type: 'string',
                        format: 'uri',
                        nullable: true,
                        example: 'https://cdn.example.com/avatars/ahmed.png',
                    },
                    lastLoginAt: { type: 'string', format: 'date-time', nullable: true },
                },
            },
            ProfileResponse: {
                type: 'object',
                properties: {
                    message: { type: 'string', example: 'Profile retrieved successfully' },
                    data: { $ref: '#/components/schemas/Profile' },
                },
            },
            UpdateProfileInput: {
                type: 'object',
                additionalProperties: false,
                minProperties: 1,
                properties: {
                    name: { type: 'string', minLength: 2, maxLength: 100, example: 'Ahmed Ben Ali' },
                    avatarUrl: {
                        type: 'string',
                        format: 'uri',
                        nullable: true,
                        maxLength: 2048,
                        description: 'URL https de l’image, ou null pour la supprimer',
                        example: 'https://cdn.example.com/avatars/ahmed.png',
                    },
                },
            },
            ChangePasswordInput: {
                type: 'object',
                additionalProperties: false,
                required: ['currentPassword', 'newPassword'],
                properties: {
                    currentPassword: {
                        type: 'string',
                        format: 'password',
                        maxLength: 128,
                        writeOnly: true,
                        example: 'Test@123456',
                    },
                    newPassword: {
                        type: 'string',
                        format: 'password',
                        minLength: 8,
                        maxLength: 128,
                        writeOnly: true,
                        description: 'Doit être différent du mot de passe actuel',
                        example: 'Nouveau@123456',
                    },
                },
            },
            ChangePasswordResponse: {
                type: 'object',
                properties: {
                    message: { type: 'string', example: 'Password changed successfully' },
                    data: { type: 'object', nullable: true, example: null },
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
                description: 'JWT applicatif obtenu après une connexion par email/mot de passe ' +
                    'ou GitHub OAuth. Coller seulement accessToken dans Authorize, ' +
                    'sans le préfixe Bearer.',
            },
        },
    },
};