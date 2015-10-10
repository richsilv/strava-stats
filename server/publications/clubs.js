Meteor.publish('clubs', () => {
  return Clubs.find()
})
