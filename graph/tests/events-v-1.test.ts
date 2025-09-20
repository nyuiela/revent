import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { BigInt, Address } from "@graphprotocol/graph-ts"
import { AttendeeAttended } from "../generated/schema"
import { AttendeeAttended as AttendeeAttendedEvent } from "../generated/EventsV1/EventsV1"
import { handleAttendeeAttended } from "../src/events-v-1"
import { createAttendeeAttendedEvent } from "./events-v-1-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#tests-structure

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let eventId = BigInt.fromI32(234)
    let attendee = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let newAttendeeAttendedEvent = createAttendeeAttendedEvent(
      eventId,
      attendee
    )
    handleAttendeeAttended(newAttendeeAttendedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#write-a-unit-test

  test("AttendeeAttended created and stored", () => {
    assert.entityCount("AttendeeAttended", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "AttendeeAttended",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "eventId",
      "234"
    )
    assert.fieldEquals(
      "AttendeeAttended",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "attendee",
      "0x0000000000000000000000000000000000000001"
    )

    // More assert options:
    // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#asserts
  })
})
