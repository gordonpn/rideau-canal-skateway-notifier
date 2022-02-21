import axios from "axios";
import cronstrue from "cronstrue";
import "dotenv/config";
import cron from "node-cron";
import log from "npmlog";

let lastStatus = "";

const fetchCurrentStatus = async () => {
  const url =
    "https://services2.arcgis.com/WLyMuW006nKOfa5Z/arcgis/rest/services/RCS_General_Notice_PUBLIC/FeatureServer/0/query?where=1=1&outFields=*&returnGeometry=false&f=pgeojson";
  let currentStatus = "";
  let lastUpdated = "";
  try {
    const response = await axios.get(url);
    currentStatus = response.data.features[0].properties.Notice_Status;
    log.info(`${process.pid}`, "Current status", currentStatus);
    [, lastUpdated] =
      response.data.features[0].properties.General_Notice.replace(
        /<[^>]*>?/gm,
        ""
      ).split("Last updated: ");
    log.info(`${process.pid}`, "Last updated", lastUpdated);
  } catch (e: any) {
    log.error(
      `${process.pid}`,
      "Error while fetching skateway status",
      e.message
    );
  }
  return { currentStatus, lastUpdated };
};

const sendSlackNotification = async (
  currentStatus: string,
  lastUpdated: string
) => {
  const url: string = process.env.SLACK_WEBHOOK_URL || "";
  if (!url) {
    throw new Error("SLACK_WEBHOOK_URL is empty");
  }
  try {
    log.info(`${process.pid}`, "Sending Slack notification");
    await axios.post(url, {
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `The Rideau Canal skateway is *${currentStatus.toLowerCase()}*\nLast updated: ${lastUpdated}`,
          },
        },
      ],
    });
  } catch (e: any) {
    log.error(
      `${process.pid}`,
      "Error while sending Slack notification",
      e.message
    );
  }
};

const task = async () => {
  const { currentStatus, lastUpdated } = await fetchCurrentStatus();
  if (currentStatus && currentStatus !== lastStatus) {
    lastStatus = currentStatus;
    sendSlackNotification(currentStatus, lastUpdated);
  }
};

const everyHourAtMinuteThirty = "30 * * * *";

task();
log.info(
  `${process.pid}`,
  "Scheduling task",
  cronstrue.toString(everyHourAtMinuteThirty)
);
cron.schedule(everyHourAtMinuteThirty, task);
