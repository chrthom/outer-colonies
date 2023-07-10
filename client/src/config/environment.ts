class DevelopmentEnvironment {
    name = 'development';
    urls = {
        website: 'http://localhost:4200',
        api: 'http://localhost:3000'
    }
}

export const environment = new DevelopmentEnvironment();