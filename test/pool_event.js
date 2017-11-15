const utils = require('./helpers/Utils');

const StoxTestToken = artifacts.require("./token/StoxTestToken.sol");
artifacts.require("./events/PoolEvent.sol");
const PoolEvent = artifacts.require("./events/PoolEvent.sol");
const EventFactory = artifacts.require("./events/EventFactory.sol");
const EventFactoryImpl = artifacts.require("./events/EventFactoryImpl.sol");
const Oracle = artifacts.require("./oracles/Oracle.sol");
const OracleFactory = artifacts.require("./oracles/OracleFactory.sol");
const OracleFactoryImpl = artifacts.require("./oracles/OracleFactoryImpl.sol");

let stoxTestToken;
let eventFactory;
let eventFactoryImpl;
let poolEvent;
let oracleFactory;
let oracleFactoryImpl;
let oracle;

// Accounts
let eventOperator;
let oracleOperator;
let player1;
let player2;
let player3;

function getLogArg(result, arg, logIndex = 0) {
    return result.logs[logIndex].args[arg];
}

contract('PoolEvent', function(accounts) {

    let factoryOperator = accounts[0];
    let oracleOperator  = accounts[1];
    let eventOperator   = accounts[2];
    let player1         = accounts[3];
    let player2         = accounts[4];
    let player3         = accounts[5];

    let tommorowInSeconds;

    async function init() {
        //oracle = await oracleFactory.createOracle("Test Oracle", {from: oracleOperator});
        await oracleFactory.createOracle("Test Oracle", {from: oracleOperator}).then(function(result) {
            oracle = Oracle.at(getLogArg(result, "_oracle"));
        });
    }

    async function initEvent() {
        init();
        
        await eventFactory.createPoolEvent(oracle.address, tommorowInSeconds, tommorowInSeconds, "Test Event", {from: eventOperator}).then(function(result) {
            poolEvent = PoolEvent.at(getLogArg(result, "_newEvent"));
        });
    }

    async function initEventWithOutcomes(event) {
        initEvent();

        await poolEvent.addOutcome("o1", {from: eventOperator});
        await poolEvent.addOutcome("o2", {from: eventOperator});
        await poolEvent.addOutcome("o3", {from: eventOperator});
    }

    async function initPlayers() {
        await eventFactory.createPoolEvent(oracle.address, tommorowInSeconds, tommorowInSeconds, "Test Event", {from: eventOperator}).then(function(result) {
            poolEvent = PoolEvent.at(getLogArg(result, "_newEvent"));
        });
    }

    before(async function() {
        // runs before all tests in this block
        stoxTestToken = await StoxTestToken.new("Stox Text", "STX", 18);
        
        oracleFactoryImpl = await OracleFactoryImpl.new()
        oracleFactory = await OracleFactory.new(oracleFactoryImpl.address, {from: factoryOperator});
        
        eventFactoryImpl = await EventFactoryImpl.new(stoxTestToken.address);
        eventFactory = await EventFactory.new(eventFactoryImpl.address, {from: factoryOperator})

        var tomorrow = new Date();
        tomorrow.setDate((new Date).getDate() + 1);
        tommorowInSeconds = Math.round(tomorrow.getTime() / 1000);
      });

    it("should throw if event name is invalid", async function() {
        await init();

        await eventFactory.createPoolEvent(oracle.address, tommorowInSeconds, tommorowInSeconds, "Test Event", {from: eventOperator}).then(function(result) {
            poolEvent = PoolEvent.at(getLogArg(result, "_newEvent"));
        });

        let name = await poolEvent.name.call();

        assert.equal(name, "Test Event");
     });

    it("should throw if oracle address is invalid", async function() {
        await init();

        try {
            await eventFactory.createPoolEvent(0, tommorowInSeconds, tommorowInSeconds, "Test Event", {from: eventOperator});
        } catch (error) {
            return utils.ensureException(error);
        }

        assert.equal(false, "Didn't throw");
    });

    it("should throw if event end time is invalid", async function() {
        await init();

        try {
            await eventFactory.createPoolEvent(oracle.address, 0, tommorowInSeconds, "Test Event", {from: eventOperator});
        } catch (error) {
            return utils.ensureException(error);
        }

        assert.equal(false, "Didn't throw");
    });

    it("should throw if options buying end time is invalid", async function() {
        await init();

        try {
            await eventFactory.createPoolEvent(oracle.address, tommorowInSeconds, 0, "Test Event", {from: eventOperator});
        } catch (error) {
            return utils.ensureException(error);
        }

        assert.equal(false, "Didn't throw");
    });

    it("should throw if options buying end time is invalid", async function() {
        await init();

        try {
            await eventFactory.createPoolEvent(oracle.address, tommorowInSeconds, 0, "Test Event", {from: eventOperator});
        } catch (error) {
            return utils.ensureException(error);
        }

        assert.equal(false, "Didn't throw");
    });

    it("should throw if event end time < options buying end time", async function() {
        await init();

        try {
            await eventFactory.createPoolEvent(oracle.address, tommorowInSeconds, (tommorowInSeconds + 1000), "Test Event", {from: eventOperator});
        } catch (error) {
            return utils.ensureException(error);
        }

        assert.equal(false, "Didn't throw");
    });

    it("should throw if outcome name is invalid", async function() {
        await initEvent();

        try {
            await poolEvent.addOutcome("", {from: eventOperator});
        } catch (error) {
            return utils.ensureException(error);
        }

        assert.equal(false, "Didn't throw");
    });

    it("should throw if a non owner added outcome", async function() {
        await initEvent();

        try {
            await poolEvent.addOutcome("outcome1", {from: player1});
        } catch (error) {
            return utils.ensureException(error);
        }

        assert.equal(false, "Didn't throw");
    });

    it("verify that the owner can add an outcome", async function() {
        await initEvent();
        await poolEvent.addOutcome("outcome1", {from: eventOperator});
        
        let outcomeName = await poolEvent.getOutcome(1);
        
        assert.equal(outcomeName, "outcome1");
    });

    it("should throw if event is published without outcomes", async function() {
        await initEvent();

        try {
            await poolEvent.publish({from: eventOperator});
        } catch (error) {
            return utils.ensureException(error);
        }

        assert.equal(false, "Didn't throw");
    });

    it("should throw if event is published with 1 outcome", async function() {
        await initEvent();

        await poolEvent.addOutcome("outcome1", {from: eventOperator});
        try {
            await poolEvent.publish({from: eventOperator});
        } catch (error) {
            return utils.ensureException(error);
        }

        assert.equal(false, "Didn't throw");
    });

    it("should throw if a non owner publish the event", async function() {
        await initEventWithOutcomes();

        try {
            await poolEvent.publish({from: player1});
        } catch (error) {
            return utils.ensureException(error);
        }

        assert.equal(false, "Didn't throw");
    });

    it("verify that the owner published the event", async function() {
        await initEventWithOutcomes();

        await poolEvent.publish({from: eventOperator});
        let eventStatus = await poolEvent.status.call();
        assert.equal(eventStatus, 1);
    });

    /*it("Create Oracle", async function() {
        await initEvent();
        return OracleFactory.deployed().then(function(instance) {
            oracleFactory = instance;
            return oracleFactory.createOracle("Cool Oracle");
        }).then(function(result) {
            for (var i = 0; i < result.logs.length; i++) {
                var log = result.logs[i];
        
                if (log.event == "OracleCreated") {
                  foundCreateOracle = true;
                  break;
                }
              }

            assert(foundCreateOracle, "We didn't find the created oracle");

            oracle = Oracle.at(result.logs[0].args["oracle"]);
            return oracle.getOracleName.call();
        }).then(function(name) {
            assert.equal(name, "Cool Oracle", "function returned " + name);
        });
      });

      it("Create PoolEvent with oracle", function() {
        return EventFactory.deployed().then(function(instance) {
            eventFactory = instance;
            return eventFactory.createPoolEvent(oracle.address, 0, 0, "Cool Event");
        }).then(function(result) {
            for (var i = 0; i < result.logs.length; i++) {
                var log = result.logs[i];
        
                if (log.event == "PoolEventCreated") {
                  foundCreateEvent = true;
                  break;
                }
              }

            assert(foundCreateEvent, "We didn't find the created event");

            poolEvent = PoolEvent.at(result.logs[0].args["newEvent"]);
            return poolEvent.getEventName.call();
        }).then(function(name) {
            assert.equal(name, "Cool Event", "function returned " + name);
        });
      });*/

      /*it("Add outcome 1 - \"Barcelona\"", function() {
            return event.getEventName.call();
        }).then(function(name) {
            assert.equal(name, "Cool Event", "function returned " + name);
      });*/

      /*it("Add outcome 1 - \"Barcelona\"", function() {
        return Event.deployed().then(function(instance) {
            eventFactory = instance;
            return eventFactory.createEvent(oracle.address, 0, 0, "Cool Event");
        }).then(function(result) {
            for (var i = 0; i < result.logs.length; i++) {
                var log = result.logs[i];
        
                if (log.event == "OnEventCreated") {
                  foundCreateEvent = true;
                  break;
                }
              }

            assert(foundCreateEvent, "We didn't find the created event");

            event = Event.at(result.logs[0].args["newEvent"]);
            return event.getEventName.call();
        }).then(function(name) {
            assert.equal(name, "Cool Event", "function returned " + name);
        });
      });

      it("Add outcome 1 - \"Barcelona\"", function() {
        return event.addOutcome("Barcelona").then(function(result) {
            return event.getOutcome.call(1);
        }).then(function(name) {
        return event.addOutcome("Barcelona").then(function(result) {
            return event.getOutcome.call(1);
        }).then(function(name) {
            assert.equal(name, "Barcelona", "function returned " + name);
        });
      });

    /*it("Add outcome to event",  function() {
        return OracleFactory.deployed().then(funtion(instance) {
            oracleFactory = instance;
            return oracleFactory.createOracle.call("aa");
        
        }).then(function(outCoinBalance) {
        }
        let oracleFactory = OracleFactory.deployed();
        oracle = oracleFactory.createOracle("aa");

        assert.equal("aa", oracle.mData);
    });*/

    /*before(function() {
        let timeOnSeconds = Math.floor(Date.now() / 1000);
        
        // create oracle
        oracle = await Oracle.new(null);
        
        // create event
        event = await Event.new(oracle.address, timeOnSeconds + 60000, timeOnSeconds + 60000, null);
        
    });

    it("Add outcome to event",  function() {
        assert.equal(event.addOutcome(null), 1)
        assert.equal(event.addOutcome(null), 2)
      });*/
});