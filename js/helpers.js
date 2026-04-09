import { registerHelper } from './template.js'
import logger from './logger.js'
import utils from './utils.js'

registerHelper('log', function (value) {
  logger.debug('template.log: ' + JSON.stringify(value, null, ' '))
})

registerHelper('dateFormat', function (value) {
  return utils.formatDate(value, 'DD/MM/YYYY')
})

registerHelper('lowerCase', function (value) {
  if (value) return value.toLowerCase()
})

registerHelper('newerPageLink', function (value) {
  var no = value - 1
  return '/blog' + (no == 1 ? '' : '/page' + no)
})

registerHelper('olderPageLink', function (value) {
  return '/blog/page' + (++value)
})

export default {}
