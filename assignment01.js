const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 2000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
const clock = new THREE.Clock();
const celestialBodies = [];
const stars = [];

/**
 * Max Number of Stars.
 */
const NUM_STARS = 50;
const RANGE_X_Z = [-200, 200];
const RANGE_Y = [-75, 75];

/**
 * Scene properties that will be controlled by DAT.GUI controls.
 */
const sceneProps = {
    showBodyMovement: true,
    planetSpeed: 5,
    moonSpeed: 5,
    numberOfStars: NUM_STARS
}

/**
 * Celestial body base class that will be used to render bodies in the sky on the
 * solar system simulation. Bodies rendered by this class won't have any type of
 * movement in the sky
 */
class CelestialBody {
    /**
     * The constructor for the celestial bodies.
     * 
     * @param {*} radius     The body's radius.
     * @param {*} color      The body's color.
     * @param {*} px         The body's position on x axis.
     * @param {*} py         The body's position on y axis.
     * @param {*} pz         The body's position on z axis.
     * @param {*} emitsLight Flag indicating whether the body emits light.
     */
    constructor(radius, color, px, py, pz, emitsLight, isStar) {
        this.numberOfSegments = 50;
        this.radius = radius;
        this.color = color;
        this.px = px;
        this.py = py;
        this.pz = pz;
        this.emitsLight = emitsLight;
        this.isStar = isStar;
        this.light = undefined;
        this.body = this.createBody();
    }

    /**
     * Method that will create and render the celestial body in the screen.
     */
    createBody() {
        const geometry = new THREE.SphereGeometry(this.radius, this.numberOfSegments, this.numberOfSegments)
        const material = new THREE.MeshPhongMaterial({
            color: this.color,
            emissive: (this.emitsLight ? this.color : 0x000000)
        });
        const body = new THREE.Mesh(geometry, material);
        body.position.set(this.px, this.py, this.pz);

        // Checks for light emission.
        if (this.emitsLight) {
            this.light = new THREE.PointLight(0xffffff, 1, this.isStar ? 100 : 0, this.isStar ? 5 : 2);
            this.light.position.set(this.px, this.py, this.pz);
        }

        return body;
    }
}

/**
 * Class that will created an orbiting celestial body in the sky. An orbiting celestial body
 * will have a circular orbit around a parent celestial body and will folow this body wherever
 * it goes.
 */
class OrbitingCelestialBody extends CelestialBody {
    /**
     * Constructor for orbiting celestial bodies.
     * 
     * @param {*} radius             The body's radius.
     * @param {*} color              The body's color.
     * @param {*} orbitRadius        The body's orbit radius.
     * @param {*} orbitedBody        The orbited body.
     * @param {*} referenceOrbitTime The reference orbit time used to calculate the time proportion for the orbit
     * @param {*} bodyOrbitTime      The body's orbit time
     */
    constructor(radius, color, orbitRadius, orbitedBody, referenceOrbitTime, bodyOrbitTime, isMoon) {
        super(
            radius,
            color,
            orbitRadius + orbitedBody.px,
            isMoon ? (-0.5 + Math.random()) * orbitedBody.radius + 2 * radius + 0.1 : 0,
            orbitRadius + orbitedBody.pz,
            false
        );

        const random = Math.random();
        const signal = random < 0.50 ? -1 : 1;

        this.orbitRadius = orbitRadius;
        this.orbitedBody = orbitedBody;
        this.bodyOrbitTime = bodyOrbitTime / referenceOrbitTime;
        this.angle = isMoon ? 2 * Math.PI * signal * Math.random() : 0;
        this.delta = 2 * Math.PI / 360;
        this.isMoon = isMoon;
    }

    updatePosition() {
        this.angle += this.delta / this.bodyOrbitTime * (this.isMoon ? sceneProps.moonSpeed : sceneProps.planetSpeed);
        this.px = Math.cos(this.angle) * this.orbitRadius + this.orbitedBody.px;
        this.pz = Math.sin(this.angle) * this.orbitRadius + this.orbitedBody.pz;
        this.body.position.set(this.px, this.py, this.pz);
    }
}

/**
 * Number of Moons per planet.
 */
const EARTH_NUM_MOONS = 1;
const JUPITER_NUM_MOONS = 5;
const SATURN_NUM_MOONS = 3;

/**
 * Radius correction proportions for the sun, small planets and big planets.
 * This corrections are applied, so all planets are visible on the screen. 
 */
const SUN_PROP = 15;
const MED_PLAN_PROP = 70;
const BIG_PLAN_PROP = 40;
const SML_PLAN_PROP = 150;
const DWF_PLAN_PROP = 225;

/**
 * Distance correction proportions, so all planets can be viewed in the same screen.
 * If the real proportions are followed, some planets will be very far from the sun.
 */
const SML_DIST_PROP = 1.75;
const MED_DIST_PROP = 2.75;
const BIG_DIST_PROP = 4.25;
const VBI_DIST_PROP = 5.25;

/**
 * Planet radius based on sun's. There are some proportions as well so all planets are visible
 */
const baseRadius = 695508;
const sunRadius = SUN_PROP * 695508 / baseRadius;
const mercuryRadius = SML_PLAN_PROP * 2440 / baseRadius;
const venusRadius = SML_PLAN_PROP * 6052 / baseRadius;
const earthRadius = SML_PLAN_PROP * 6371 / baseRadius;
const marsRadius = SML_PLAN_PROP * 3397 / baseRadius;
const jupiterRadius = BIG_PLAN_PROP * 71492 / baseRadius;
const saturnRadius = BIG_PLAN_PROP * 60268 / baseRadius;
const uranusRadius = MED_PLAN_PROP * 25559 / baseRadius;
const neptuneRadius = MED_PLAN_PROP * 24766 / baseRadius;
const plutoRadius = DWF_PLAN_PROP * 1185 / baseRadius;
const moonRadius = plutoRadius / 1.25;
const starRadius = 0.1;

/**
 * Planet distances from the sun, calculated with with the above proportions for better
 * viewing of the planets on the screen.
 */
const propDist = SUN_PROP + 2.5;
const baseDist = 57900;
const mercuryDist = propDist * 57900 / baseDist;
const venusDist = propDist * 108160 / baseDist / 1.5;
const earthDist = propDist * 149600 / baseDist / 1.5;
const marsDist = propDist * 227937 / baseDist / 1.75;
const jupterDist = propDist * 778369 / baseDist / 3.5;
const saturnDist = propDist * 1427034 / baseDist / 4.5;
const uranusDist = propDist * 2870658 / baseDist / 6.25;
const neptuneDist = propDist * 4496976 / baseDist / 7.5;
const plutoDist = propDist * 5906375 / baseDist / 8.25;
const earthMoonDist = earthRadius + 1;
const jupiterMoonDist = jupiterRadius + 1;
const saturnMoonDist = saturnRadius + 1;

/**
 * Planet times in days to get around the sun. Those times will be used for calculating
 * the orbit time of each planet.
 */
const mercuryTime = 88;
const venusTime = 224;
const earthTime = 365.25;
const marsTime = 687;
const jupiterTime = 4332;
const saturnTime = 10592;
const uranusTime = 30681;
const neptuneTime = 60193;
const plutoTime = 90582;
const earthMoonTime = 28;
const jupiterMoonTime = 125;
const saturnMoonTime = 78;

/**
 * Initialization function. This function will perform the application's initial setup.
 * This will setup the renderer properties and the trackball controll.
 */
function init() {
    // The renderer
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(new THREE.Color(0x000000));
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Appends the renderer DOM to the document body.
    document.body.appendChild(renderer.domElement);

    // Add Trackball Controls.
    trackballControls = new THREE.TrackballControls(camera, renderer.domElement);
}

/**
 * Function that will set up the application's camera and extra lights. The sun's emission light is
 * done when creating the celestial objects. It's a constructor parameter.
 */
function setupCameraAndLight() {
    camera.position.set(0, 0, 150);
    camera.lookAt(scene.position);
}

function createGeometry() {
    // The Stars
    for (let i = 0; i < NUM_STARS; i++) {
        const px = RANGE_X_Z[i % 2] * ((-0.5 + Math.random()) * 2);
        const py = RANGE_Y[i % 2] * ((-0.5 + Math.random()) * 2);
        const pz = RANGE_X_Z[i % 2] * ((-0.5 + Math.random()) * 2);
        stars.push(new CelestialBody(starRadius, 0xffffff, px, py, pz, true, true))
    }

    // The Sun.
    celestialBodies.push(new CelestialBody(sunRadius, 0xf9d71c, 0, 0, 0, true, false));

    // The nine planets.
    celestialBodies.push(new OrbitingCelestialBody(mercuryRadius, 0xC5C5C5, mercuryDist, celestialBodies[0], mercuryTime, mercuryTime, false));
    celestialBodies.push(new OrbitingCelestialBody(venusRadius, 0xFFFACD, venusDist, celestialBodies[0], mercuryTime, venusTime, false));
    celestialBodies.push(new OrbitingCelestialBody(earthRadius, 0x1E90FF, earthDist, celestialBodies[0], mercuryTime, earthTime, false));
    celestialBodies.push(new OrbitingCelestialBody(marsRadius, 0xD2B48C, marsDist, celestialBodies[0], mercuryTime, marsTime, false));
    celestialBodies.push(new OrbitingCelestialBody(jupiterRadius, 0xFFA500, jupterDist, celestialBodies[0], mercuryTime, jupiterTime, false));
    celestialBodies.push(new OrbitingCelestialBody(saturnRadius, 0xF0E68C, saturnDist, celestialBodies[0], mercuryTime, saturnTime, false));
    celestialBodies.push(new OrbitingCelestialBody(uranusRadius, 0xADD8E6, uranusDist, celestialBodies[0], mercuryTime, uranusTime, false));
    celestialBodies.push(new OrbitingCelestialBody(neptuneRadius, 0xFFA500, neptuneDist, celestialBodies[0], mercuryTime, neptuneTime, false));
    celestialBodies.push(new OrbitingCelestialBody(plutoRadius, 0xFFEBCD, plutoDist, celestialBodies[0], mercuryTime, plutoTime, false));

    // The Earth Moon.
    for (let i = 0; i < EARTH_NUM_MOONS; i++) {
        celestialBodies.push(
            new OrbitingCelestialBody(
                moonRadius, 
                0xC5C5C5, 
                earthMoonDist,
                celestialBodies[3],
                mercuryTime,
                earthMoonTime,
                true));
    }

    // Jupter Moons.
    for (let i = 0; i < JUPITER_NUM_MOONS; i++) {
        celestialBodies.push(
            new OrbitingCelestialBody(
                moonRadius, 
                0xC5C5C5,
                jupiterMoonDist + Math.random() * 0.75,
                celestialBodies[5],
                mercuryTime,
                jupiterMoonTime * (Math.random() + 0.75),
                true));
    }

    // Saturn Moons.
    for (let i = 0; i < SATURN_NUM_MOONS; i++) {
        celestialBodies.push(
            new OrbitingCelestialBody(
                moonRadius,
                0xC5C5C5,
                saturnMoonDist + Math.random() * 0.75,
                celestialBodies[6],
                mercuryTime,
                saturnMoonTime * (Math.random() + 0.75),
                true));
    }

    for (body of celestialBodies) {
        scene.add(body.body);
        if (body.emitsLight) {
            scene.add(body.light);
        }
    }

    for (star of stars) {
        scene.add(star.body);
        if (star.emitsLight) {
            scene.add(star.light);
        }
    }
}

function setupDatGui() {
    let controls = new function () {
        this.showBodyMovement = sceneProps.showBodyMovement;
        this.planetSpeed = sceneProps.planetSpeed;
        this.showMercury = true;
        this.showVenus = true;
        this.showEarth = true;
        this.showMars = true;
        this.showJupiter = true;
        this.showSaturn = true;
        this.showUranus = true;
        this.showNeptune = true;
        this.showPluto = true;
        this.numberOfStars = NUM_STARS;
    }

    let gui = new dat.GUI();
    gui.add(controls, 'showBodyMovement').name('Move Bodies').onChange((move) => sceneProps.showBodyMovement = move);
    gui.add(controls, 'planetSpeed', 1, 25).name('Planet Speed').step(0.1).onChange((speed) => sceneProps.planetSpeed = speed);
    gui.add(controls, 'showMercury').name('Show Earth').onChange((visible) => celestialBodies[1].body.visible = visible);
    gui.add(controls, 'showVenus').name('Show Venus').onChange((visible) => celestialBodies[2].body.visible = visible);
    gui.add(controls, 'showEarth').name('Show Earth').onChange((visible) => celestialBodies[3].body.visible = visible);
    gui.add(controls, 'showMars').name('Show Mars').onChange((visible) => celestialBodies[4].body.visible = visible);
    gui.add(controls, 'showJupiter').name('Show Jupiter').onChange((visible) => celestialBodies[5].body.visible = visible);
    gui.add(controls, 'showSaturn').name('Show Saturn').onChange((visible) => celestialBodies[6].body.visible = visible);
    gui.add(controls, 'showUranus').name('Show Uranus').onChange((visible) => celestialBodies[7].body.visible = visible);
    gui.add(controls, 'showNeptune').name('Show Neptune').onChange((visible) => celestialBodies[8].body.visible = visible);
    gui.add(controls, 'showPluto').name('Show Pluto').onChange((visible) => celestialBodies[9].body.visible = visible);
    gui.add(controls, 'numberOfStars', 0, NUM_STARS).name('Number of Stars').step(10).onChange((numberOfStars) => {
        for (let i = 0; i < numberOfStars; i++) {
            stars[i].body.visible = true;
            stars[i].light.visible = true;
        }

        for (let i = numberOfStars; i < NUM_STARS; i++) {
            stars[i].body.visible = false;
            stars[i].light.visible = false;
        }
    });
}

function render() {
    // Updates the controls.
    trackballControls.update(clock.getDelta());

    // Updates the body positions;
    if (sceneProps.showBodyMovement) {
        for (let i = 1; i < celestialBodies.length; i++) {
            celestialBodies[i].updatePosition();
        }
    }

    // Renders the scene.
    renderer.render(scene, camera);

    // To call itself.
    requestAnimationFrame(render);
}

window.onload = () => {
    init();
    setupCameraAndLight();
    createGeometry();
    setupDatGui();
    render();
};
