class AnimationConfig {
    readonly duration = {
        attack: 1000,
        draw: 400,
        move: 500,
        showTacticCard: 600,
        waitBeforeDiscard: 2000,
        buffer: 50
    };
    readonly attack = {
        indicator: {
            yTween: 100,
            spawnInterval: 200
        },
        flare: {
            yOffset: 120,
            lifetime: 800
        }
    }
}

export const animationConfig = new AnimationConfig();