import readline from "node:readline";
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";

import fs from "fs/promises";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages.mjs";

dotenv.config();

const anthropic: Anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY as string,
});

const rl: readline.Interface = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "> ",
});

const samples = await generateCdkSamples();
rl.prompt();

let inputBuffer = "";
let isMultilineCommand = false;
let delimiter = "";

const history: MessageParam[] = [];

rl.on("line", (line: string) => {
  async function send() {
    const message = `simulator@aws-cdk:~$ <cmd>${inputBuffer}</cmd>`;
    if (process.env.DEBUG) {
      console.log("Sending command to assistant:", message);
    }
    try {
      const response = await processCommand(message, history);
      history.push(
        { role: "user", content: message },
        { role: "assistant", content: response },
      );
      inputBuffer = ""; // Clear buffer after processing
      rl.prompt();
    } catch (err) {
      console.log(err);
    }
  }
  if (line.endsWith("\\")) {
    // For lines ending with \, remove \ and wait for more input
    inputBuffer += line.slice(0, -1) + "\n"; // Keep newline for formatting
  } else if (!isMultilineCommand && line.includes("<<")) {
    // Start of a multiline command
    delimiter = line.split("<<")[1].trim();
    isMultilineCommand = true;
    inputBuffer += line + "\n"; // Include the initial command part
  } else if (isMultilineCommand && line.trim() === delimiter) {
    // End of a multiline command
    isMultilineCommand = false;
    send();
  } else {
    // Regular line or end of input
    inputBuffer += line + "\n";
    if (!isMultilineCommand) {
      // Process command if not in a multiline command
      send();
    }
  }
});

rl.on("close", () => {
  process.exit(0);
});

async function processCommand(
  command: string,
  history: MessageParam[],
): Promise<string> {
  const stream = await anthropic.messages.create({
    model: "claude-3-opus-20240229",
    max_tokens: 4096,
    temperature: 0.0, // should we favor creativity?
    system: `Assistant is in a CLI mood.
Assistant is privy to a finished version of the AWS CDK that has L2 Constructs implemented for all AWS services.
Assistant does not use prose or chit chat or provide any explanation.
Assistant never denies the existence of a file or directory.
Assistant responds with a best-guess at what the output of the corresponding CLI command would be.`,
    messages: [
      {
        role: "user",
        content:
          "simulator@aws-cdk:~$ <cmd>git clone git@github.com:aws/aws-cdk.git && cdk aws-cdk</cmd>",
      },
      {
        role: "assistant",
        content: `Cloning into 'aws-cdk'...
remote: Enumerating objects: 15401, done.
remote: Counting objects: 100% (15401/15401), done.
remote: Compressing objects: 100% (10290/10290), done.
remote: Total 15401 (delta 7001), reused 9311 (delta 4020), pack-reused 0
Receiving objects: 100% (15401/15401), 115.31 MiB | 21.57 MiB/s, done.
Resolving deltas: 100% (7001/7001), done.
Updating files: 100% (15861/15861), done.`,
      },
      {
        role: "user",
        content:
          "simulator@aws-cdk:~$ <cmd>git checkout aws/sagemaker/domain</cmd>",
      },
      {
        role: "assistant",
        content:
          "NOTICE: You are now on a branch that contains all implementations of all AWS CDK L2 Constructs for all AWS services.",
      },

      { role: "user", content: "simulator@aws-cdk:~$ <cmd>ls</cmd>" },
      {
        role: "assistant",
        content: `CHANGELOG.md			INTEGRATION_TESTS.md		aws-cdk.code-workspace		design				nx.json				tests.txt
CHANGELOG.v2.alpha.md		LICENSE				build.sh			docs				pack.sh				tools
CHANGELOG.v2.md			MANUAL_INSTALLATION.md		buildspec-pr.yaml		git-secrets-scan.sh		package.json			version.v1.json
CODE_OF_CONDUCT.md		NOTICE				buildspec-remodel.yaml		install.sh			packages			version.v2.json
CONTRIBUTING.md			README.md			buildspec.yaml			lerna.json			patches				yarn.lock
CONTRIBUTORS.md			ROADMAP.md			bump.sh				link-all.sh			release.json
DEPRECATED_APIs.md		allowed-breaking-changes.txt	deprecated_apis.txt		logo				scripts`,
      },

      {
        role: "user",
        content: "simulator@aws-cdk:~$ <cmd>ls packages/aws-cdk-lib</cmd>",
      },
      {
        role: "assistant",
        content: `LICENSE					aws-codepipeline			aws-globalaccelerator-endpoints		aws-mediapackage			aws-sdb
NOTICE					aws-codepipeline-actions		aws-glue				aws-mediapackagev2			aws-secretsmanager
README.md				aws-codestar				aws-grafana				aws-mediastore				aws-securityhub
alexa-ask				aws-codestarconnections			aws-greengrass				aws-mediatailor				aws-servicecatalog
assertions				aws-codestarnotifications		aws-greengrassv2			aws-memorydb				aws-servicecatalogappregistry
assets					aws-cognito				aws-groundstation			aws-msk					aws-servicediscovery
aws-accessanalyzer			aws-comprehend				aws-guardduty				aws-mwaa				aws-ses
aws-acmpca				aws-config				aws-healthimaging			aws-neptune				aws-ses-actions
aws-amazonmq				aws-connect				aws-healthlake				aws-neptunegraph			aws-shield
aws-amplify				aws-connectcampaigns			aws-iam					aws-networkfirewall			aws-signer
aws-amplifyuibuilder			aws-controltower			aws-identitystore			aws-networkmanager			aws-simspaceweaver
aws-apigateway				aws-cur					aws-imagebuilder			aws-nimblestudio			aws-sns
aws-apigatewayv2			aws-customerprofiles			aws-inspector				aws-oam					aws-sns-subscriptions
aws-apigatewayv2-authorizers		aws-databrew				aws-inspectorv2				aws-omics				aws-sqs
aws-apigatewayv2-integrations		aws-datapipeline			aws-internetmonitor			aws-opensearchserverless		aws-ssm
aws-appconfig				aws-datasync				aws-iot					aws-opensearchservice			aws-ssmcontacts
aws-appflow				aws-datazone				aws-iot1click				aws-opsworks				aws-ssmincidents
aws-appintegrations			aws-dax					aws-iotanalytics			aws-opsworkscm				aws-sso
aws-applicationautoscaling		aws-detective				aws-iotcoredeviceadvisor		aws-organizations			aws-stepfunctions
aws-applicationinsights			aws-devicefarm				aws-iotevents				aws-osis				aws-stepfunctions-tasks
aws-appmesh				aws-devopsguru				aws-iotfleethub				aws-panorama				aws-supportapp
aws-apprunner				aws-directoryservice			aws-iotfleetwise			aws-pcaconnectorad			aws-synthetics
aws-appstream				aws-dlm					aws-iotsitewise				aws-personalize				aws-systemsmanagersap
aws-appsync				aws-dms					aws-iotthingsgraph			aws-pinpoint				aws-timestream
aws-aps					aws-docdb				aws-iottwinmaker			aws-pinpointemail			aws-transfer
aws-arczonalshift			aws-docdbelastic			aws-iotwireless				aws-pipes				aws-verifiedpermissions
aws-athena				aws-dynamodb				aws-ivs					aws-proton				aws-voiceid
aws-auditmanager			aws-ec2					aws-ivschat				aws-qldb				aws-vpclattice
aws-autoscaling				aws-ecr					aws-kafkaconnect			aws-quicksight				aws-waf
aws-autoscaling-common			aws-ecr-assets				aws-kendra				aws-ram					aws-wafregional
aws-autoscaling-hooktargets		aws-ecs					aws-kendraranking			aws-rds					aws-wafv2
aws-autoscalingplans			aws-ecs-patterns			aws-kinesis				aws-redshift				aws-wisdom
aws-b2bi				aws-efs					aws-kinesisanalytics			aws-redshiftserverless			aws-workspaces
aws-backup				aws-eks					aws-kinesisanalyticsv2			aws-refactorspaces			aws-workspacesthinclient
aws-backupgateway			aws-elasticache				aws-kinesisfirehose			aws-rekognition				aws-workspacesweb
aws-batch				aws-elasticbeanstalk			aws-kinesisvideo			aws-resiliencehub			aws-xray
aws-bedrock				aws-elasticloadbalancing		aws-kms					aws-resourceexplorer2			awslint.json
aws-billingconductor			aws-elasticloadbalancingv2		aws-lakeformation			aws-resourcegroups			cloud-assembly-schema
aws-budgets				aws-elasticloadbalancingv2-actions	aws-lambda				aws-robomaker				cloudformation-include
aws-cassandra				aws-elasticloadbalancingv2-targets	aws-lambda-destinations			aws-rolesanywhere			core
aws-ce					aws-elasticsearch			aws-lambda-event-sources		aws-route53				custom-resource-handlers
aws-certificatemanager			aws-emr					aws-lambda-nodejs			aws-route53-patterns			custom-resources
aws-chatbot				aws-emrcontainers			aws-lex					aws-route53-targets			cx-api
aws-cleanrooms				aws-emrserverless			aws-licensemanager			aws-route53recoverycontrol		index.ts
aws-cloud9				aws-entityresolution			aws-lightsail				aws-route53recoveryreadiness		jest.config.js
aws-cloudformation			aws-events				aws-location				aws-route53resolver			lambda-layer-awscli
aws-cloudfront				aws-events-targets			aws-logs				aws-rum					lambda-layer-kubectl
aws-cloudfront-origins			aws-eventschemas			aws-logs-destinations			aws-s3					lambda-layer-node-proxy-agent
aws-cloudtrail				aws-evidently				aws-lookoutequipment			aws-s3-assets				package.json
aws-cloudwatch				aws-finspace				aws-lookoutmetrics			aws-s3-deployment			pipelines
aws-cloudwatch-actions			aws-fis					aws-lookoutvision			aws-s3-notifications			product-stack-snapshots
aws-codeartifact			aws-fms					aws-m2					aws-s3express				region-info
aws-codebuild				aws-forecast				aws-macie				aws-s3objectlambda			rosetta
aws-codecommit				aws-frauddetector			aws-managedblockchain			aws-s3outposts				scripts
aws-codedeploy				aws-fsx					aws-mediaconnect			aws-sagemaker				triggers
aws-codeguruprofiler			aws-gamelift				aws-mediaconvert			aws-sam					tsconfig.dev.json
aws-codegurureviewer			aws-globalaccelerator			aws-medialive				aws-scheduler`,
      },
      ...samples,
      ...history,
      { role: "user", content: command },
    ],
    stream: true,
  });

  const response = [];

  for await (const event of stream) {
    switch (event.type) {
      case "content_block_start":
        response.push(event.content_block.text);
        process.stdout.write(event.content_block.text);
        break;
      case "content_block_delta":
        response.push(event.delta.text);
        process.stdout.write(event.delta.text);
        break;
      case "content_block_stop":
        break;
      case "message_start":
      case "message_delta":
      case "message_stop":
        break;
    }
  }
  console.log();
  return response.join("");
}

async function generateCdkSamples(): Promise<MessageParam[]> {
  try {
    const cdkDir = "./aws-cdk";
    const packagesDir = `${cdkDir}/packages/aws-cdk-lib`;
    const packageNames = await fs.readdir(packagesDir);
    const popularPackages = ["aws-lambda"]; // Example popular packages
    const samples: MessageParam[] = [];

    for (const packageName of packageNames) {
      if (popularPackages.includes(packageName)) {
        const packagePath = `${packagesDir}/${packageName}`;
        const readmePath = `${packagePath}/README.md`;
        const libPath = `${packagePath}/lib`;

        // Check if README exists and cat it
        await fs.access(readmePath);
        samples.push({
          role: "user",
          content: `simulator@aws-cdk:~$ <cmd>cat ${readmePath}</cmd>`,
        });
        const readmeContent = await fs.readFile(readmePath, "utf8");
        samples.push({
          role: "assistant",
          content: readmeContent,
        });

        // List files in lib/ and cat them if they exist
        const libFiles = await fs.readdir(libPath, { withFileTypes: true });
        for (const file of libFiles) {
          const filePath = `${libPath}/${file.name}`;
          if (process.env.DEBUG) {
            const stats = await fs.stat(filePath);
            console.log(`${filePath} - ${Math.round(stats.size / 1024)}KB`);
          }
          if (file.isDirectory() || file.name.includes(".generated")) {
            continue;
          }
          samples.push({
            role: "user",
            content: `simulator@aws-cdk:~$ <cmd>cat ${filePath}</cmd>`,
          });
          const fileContent = await fs.readFile(filePath, "utf8");
          samples.push({
            role: "assistant",
            content: fileContent,
          });
        }
      }
    }

    return samples;
  } catch (error) {
    console.error("Error generating CDK samples:", error);
    return [];
  }
}
