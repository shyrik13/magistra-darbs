import {getGPUTier} from "detect-gpu";

class Tracker {

    static _instance;

    agent = navigator.userAgent;
    cpuHistory = [];
    fpsHistory = [];
    heapMemoryHistory = [];
    vertexHistory = [];
    trianglesHistory = [];

    gpuTier;
    initTime;
    alternative;
    name;
    deviceType;

    /**
     * @private
     */
    constructor() {}

    /**
     * https://stackoverflow.com/questions/12669615/add-created-at-and-updated-at-fields-to-mongoose-schemas#answer-15147350
     * !!! timestamps are in UTC, after fetching it will be server timezone.
     * { versionKey: false } - because multiple php processes can use this model.
     * @return {CubesProgramModel}
     */
    static create() {
        if (this._instance) {return this._instance;}
        this._instance = new this();

        return this._instance;
    }

    init(alternative, name){
        this.alternative = alternative;
        this.name = name;

        this.cpuHistory = [];
        this.fpsHistory = [];
        this.heapMemoryHistory = [];
        this.vertexHistory = [];
        this.trianglesHistory = [];
    }

    storeInitTime(initStart) {
        this.initTime = Date.now() - initStart; // ms
    }

    getAgent() {
        return this.agent;
    }

    getDeviceType() {
        if (!this.deviceType) {
            const ua = navigator.userAgent;
            if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
                this.deviceType = "tablet";
            }
            if (
                /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
                    ua
                )
            ) {
                this.deviceType = "mobile";
            }
            this.deviceType = "desktop";
        }

        return this.deviceType;
    }

    async getGpuTier() {
        if (!this.gpuTier) {
            this.gpuTier = await getGPUTier();
        }
        return this.gpuTier;
    }

    pushHistory(cpu, fps, heapMemory, vertex, triangles) {
        this.cpuHistory.push(cpu);
        this.fpsHistory.push(fps);

        if (heapMemory) {
            this.heapMemoryHistory.push(heapMemory);
        }

        this.vertexHistory.push(vertex);
        this.trianglesHistory.push(triangles);
    }

    getResults() {
        const average = (array) => array.reduce((a, b) => a + b) / array.length;

        return {
            status: 'success',
            agent: this.agent,
            gpuModel: this.gpuTier.gpu,
            alternative: this.alternative,
            name: this.name,
            deviceType: this.deviceType,
            initTime: +this.initTime.toFixed(0),
            cpuHistory: this.cpuHistory,
            fpsHistory: this.fpsHistory,
            heapMemoryHistory: this.heapMemoryHistory,
            vertexHistory: this.vertexHistory,
            trianglesHistory: this.trianglesHistory,
            cpu: {
                max: +(Math.max(...this.cpuHistory)).toFixed(0),
                min: +(Math.min(...this.cpuHistory)).toFixed(0),
                avg: +(average(this.cpuHistory)).toFixed(0),
            },
            fps: {
                max: +(Math.max(...this.fpsHistory)).toFixed(0),
                min: +(Math.min(...this.fpsHistory)).toFixed(0),
                avg: +(average(this.fpsHistory)).toFixed(0),
            },
            heap: {
                max: this.heapMemoryHistory ? +(Math.max(...this.heapMemoryHistory).toFixed(8)) : null,
                min: this.heapMemoryHistory ? +(Math.min(...this.heapMemoryHistory).toFixed(8)) : null,
                avg: this.heapMemoryHistory ? +(average(this.heapMemoryHistory).toFixed(8)) : null,
            },
            vertexTotal: this.vertexHistory[this.vertexHistory.length - 1],
            trianglesTotal: this.trianglesHistory[this.trianglesHistory.length - 1],
        }
    }

    getErrorResults(error) {
        return {
            status: 'error',
            agent: this.agent,
            gpuModel: this.gpuTier.gpu,
            alternative: this.alternative,
            name: this.name,
            deviceType: this.deviceType,
            error: error.message
        }
    }
}

export default Tracker;
