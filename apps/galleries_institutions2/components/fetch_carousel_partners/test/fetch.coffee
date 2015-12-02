benv = require 'benv'
sinon = require 'sinon'
Backbone = require 'backbone'
_ = require 'underscore'
{ fabricate } = require 'antigravity'
fetch = require '../fetch'
Q = require 'bluebird-q'

describe 'fetch', ->
  before (done) ->
    benv.setup ->
      benv.expose $: benv.require 'jquery'
      done()

  after ->
    benv.teardown()

  afterEach ->
    Backbone.sync.restore()

  describe 'galleries', ->
    describe 'options and query parameters', ->
      beforeEach ->
        primary = [fabricate 'partner', id: 'primary_1']
        secondary = [fabricate 'partner', id: 'secondary_1']
        sinon.stub Backbone, 'sync'
          .onCall 0
          .yieldsTo 'success', primary
          .returns Q.resolve primary
          .onCall 1
          .yieldsTo 'success', secondary
          .returns Q.resolve secondary

      it 'fetches primary and secondary buckets and applies default parameters', ->
        fetch.galleries().then (partners) ->
          Backbone.sync.args[0][2].data.should.eql
            cache: true
            eligible_for_primary_bucket: true
            has_full_profile: true
            size: 9
            sort: '-random_score'
            type: 'PartnerGallery'

          Backbone.sync.args[1][2].data.should.eql
            cache: true
            eligible_for_secondary_bucket: true
            has_full_profile: true
            size: 9
            sort: '-random_score'
            type: 'PartnerGallery'

      it 'applies additonal parameters if supplied', ->
        fetch.galleries(random_parameter: true).then (partners) ->
          Backbone.sync.args[0][2].data.should.eql
            cache: true
            eligible_for_primary_bucket: true
            has_full_profile: true
            size: 9
            sort: '-random_score'
            type: 'PartnerGallery'
            random_parameter: true

          Backbone.sync.args[1][2].data.should.eql
            cache: true
            eligible_for_secondary_bucket: true
            has_full_profile: true
            size: 9
            sort: '-random_score'
            type: 'PartnerGallery'
            random_parameter: true

      it 'resolves promise with partners', ->
        fetch.galleries().then (partners) ->
          partners.models.length.should.eql 2

    describe 'buckets', ->
      it 'uses 3 primary and 3 secondary if available', ->
        primary = [
          fabricate('partner', id: 'primary_1'),
          fabricate('partner', id: 'primary_2'),
          fabricate('partner', id: 'primary_3'),
          fabricate('partner', id: 'primary_4'),
          fabricate('partner', id: 'primary_5'),
          fabricate('partner', id: 'primary_6'),
          fabricate('partner', id: 'primary_7'),
          fabricate('partner', id: 'primary_8'),
          fabricate('partner', id: 'primary_9')
        ]
        secondary = [
          fabricate('partner', id: 'secondary_1'),
          fabricate('partner', id: 'secondary_2'),
          fabricate('partner', id: 'secondary_3'),
          fabricate('partner', id: 'secondary_4'),
          fabricate('partner', id: 'secondary_5'),
          fabricate('partner', id: 'secondary_6'),
          fabricate('partner', id: 'secondary_7'),
          fabricate('partner', id: 'secondary_8'),
          fabricate('partner', id: 'secondary_9')
        ]
        sinon.stub Backbone, 'sync'
          .onCall 0
          .yieldsTo 'success', primary
          .returns Q.resolve primary
          .onCall 1
          .yieldsTo 'success', secondary
          .returns Q.resolve secondary

        fetch.galleries().then (partners)->
          partners.length.should.eql 9
          _.each partners.slice(0, 6), (partner) ->
            partner.id.should.containEql 'primary'
          _.each partners.slice(6, 9), (partner) ->
            partner.id.should.containEql 'secondary'

      it 'uses more secondary if fewer primary are available', ->
        primary = [
          fabricate('partner', id: 'primary_1'),
          fabricate('partner', id: 'primary_2'),
          fabricate('partner', id: 'primary_3'),
          fabricate('partner', id: 'primary_4')
        ]
        secondary = [
          fabricate('partner', id: 'secondary_1'),
          fabricate('partner', id: 'secondary_2'),
          fabricate('partner', id: 'secondary_3'),
          fabricate('partner', id: 'secondary_4'),
          fabricate('partner', id: 'secondary_5'),
          fabricate('partner', id: 'secondary_6'),
          fabricate('partner', id: 'secondary_7')
        ]
        sinon.stub Backbone, 'sync'
          .onCall 0
          .yieldsTo 'success', primary
          .returns Q.resolve primary
          .onCall 1
          .yieldsTo 'success', secondary
          .returns Q.resolve secondary

        fetch.galleries().then (partners) ->
          partners.length.should.eql 9
          _.each partners.slice(0, 4), (partner) ->
            partner.id.should.containEql 'primary'
          _.each partners.slice(4, 9), (partner) ->
            partner.id.should.containEql 'secondary'

      it 'uses more primary if fewer secondary are available', ->
        primary = [
          fabricate('partner', id: 'primary_1'),
          fabricate('partner', id: 'primary_2'),
          fabricate('partner', id: 'primary_3'),
          fabricate('partner', id: 'primary_4'),
          fabricate('partner', id: 'primary_5'),
          fabricate('partner', id: 'primary_6'),
          fabricate('partner', id: 'primary_7'),
          fabricate('partner', id: 'primary_8'),
          fabricate('partner', id: 'primary_9')
        ]
        secondary = [
          fabricate('partner', id: 'secondary_1')
        ]
        sinon.stub Backbone, 'sync'
          .onCall 0
          .yieldsTo 'success', primary
          .returns Q.resolve primary
          .onCall 1
          .yieldsTo 'success', secondary
          .returns Q.resolve secondary

        fetch.galleries().then (partners) ->
          partners.length.should.eql 9
          _.each partners.slice(0, 8), (partner) ->
            partner.id.should.containEql 'primary'
          _.each partners.slice(8, 9), (partner) ->
            partner.id.should.containEql 'secondary'

      it 'uses all available partners if total partners < 9', ->
        primary = [fabricate('partner', id: 'primary_1')]
        secondary = [
          fabricate('partner', id: 'secondary_1'),
          fabricate('partner', id: 'secondary_2')
        ]
        sinon.stub Backbone, 'sync'
          .onCall 0
          .yieldsTo 'success', primary
          .returns Q.resolve primary
          .onCall 1
          .yieldsTo 'success', secondary
          .returns Q.resolve secondary

        fetch.galleries().then (partners) ->
          partners.length.should.eql 3
          _.each partners.slice(0, 1), (partner) ->
            partner.id.should.containEql 'primary'
          _.each partners.slice(1, 3), (partner) ->
            partner.id.should.containEql 'secondary'

  describe 'institutions', ->
    describe 'options and query parameters', ->
      beforeEach ->

        partners = [
          fabricate('partner', id: 'partner_1'),
          fabricate('partner', id: 'partner_2')
        ]

        sinon.stub Backbone, 'sync'
          .yieldsTo 'success', partners
          .returns Q.resolve partners

      it 'does not fetch buckets', ->
        fetch.institutions().then (partners) ->
          Backbone.sync.args[0][2].data.should.eql
            cache: true
            has_full_profile: true
            size: 9
            type: 'PartnerInstitution'
            sort: '-random_score'

      it 'applies additonal parameters if supplied', ->
        fetch.institutions(random_parameter: true).then (partners) ->
          Backbone.sync.args[0][2].data.should.eql
            cache: true
            has_full_profile: true
            size: 9
            sort: '-random_score'
            type: 'PartnerInstitution'
            random_parameter: true

      it 'resolves promise with partners', ->
        fetch.institutions().then (partners) ->
          partners.models.length.should.eql 2