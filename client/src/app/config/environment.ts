class DevelopmentEnvironment {
    name = 'development';
    urls = {
        website: 'http://localhost:4200',
        api: 'http://localhost:3000'
    }
}

class ProductionEnvironment {
    name = 'development';
    urls = {
        website: 'https://www.outercolonies.thomsen.in',
        api: 'https://api.outercolonies.thomsen.in'
    }
}

export const environment = new ProductionEnvironment();