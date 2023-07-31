import moment from "moment";
import 'moment/locale/en-ca'

const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

const momentInstance = moment.tz.setDefault(timeZone)