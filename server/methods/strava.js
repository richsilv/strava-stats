process.env.STRAVA_ACCESS_TOKEN = Meteor.settings.strava.access_token
process.env.STRAVA_CLIENT_ID = Meteor.settings.strava.client_id
process.env.STRAVA_CLIENT_SECRET = Meteor.settings.strava.client_secret
process.env.STRAVA_REDIRECT_URI = Meteor.settings.strava.redirect_uri

var strava = Meteor.npmRequire('strava-v3')

var stravaMethods = ['clubs.get', 'clubs.listMembers', 'athletes.stats'].reduce((memo, funcName) => {
  var stravaFunc = resolve(strava, funcName)
  memo[funcName] = function (args) {
    return new Promise((resolve, reject) => {
      stravaFunc.child.call(stravaFunc.parent, args, (err, payload) => {
        if (err) return reject(err)
        resolve(payload)
      })
    })
  }
  return memo
}, {})

Meteor.methods({
  'strava/getClub'(id) {
    check(id, Number)
    var club = Clubs.findOne({ id })
    if (club) return club
    return stravaMethods['clubs.get']({ id })
      .then(clubObj => {
        if (!clubObj) throw new Meteor.Error('No club found matching that id')
        clubObj._id = Clubs.insert(clubObj)
        return clubObj
      }, err => {
        console.error(err)
        throw new Meteor.Error(err.toString())
      })
  },
  'strava/getAthletes'(id, force) {
    check(id, Number)
    check(force, Match.Optional(Boolean))
    var club = Clubs.findOne({ id })
    if (!club) throw new Meteor.Error('No club found matching that id')
    if (club.athletesGathered && !force) return []
    return stravaMethods['clubs.listMembers']({ id: id, 'per_page': 200 })
      .then(members => {
        return members.reduce((athleteList, member) => {
          var athlete = Athletes.findOne({ id: member.id })
          if (!athlete) {
            member.club = id
            member.id = Athletes.insert(member)
            athleteList.push(member)
          }
          return athleteList
        }, [])
      }, err => {
        console.error(err)
        throw new Meteor.Error(err.toString())
      })
  },
  'strava/getAthleteStats'(athlete) {
    if (typeof athlete === 'number') athlete = Athletes.findOne({ id: athlete })
    else if (typeof athlete === 'string') athlete = Athletes.findOne(athlete)
    else athlete = Athletes.findOne(athlete._id)
    if (!athlete) throw new Meteor.Error('Cannot find athlete')
    return stravaMethods['athletes.stats']({ id: athlete.id })
      .then(stats => {
        return stats
      }, err => {
        console.error(err)
        throw new Meteor.Error(err.toString())
      })
  }
})

function resolve(obj, key) {
  return key.split('.').reduce((curObj, nextKey) => {
    curObj.parent = curObj.child
    if (typeof curObj.child === 'object') curObj.child = curObj.child[nextKey]
    else curObj.child = undefined
    return curObj
  }, { child: obj, parent: null })
}
