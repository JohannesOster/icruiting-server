import express from 'express';
import db, {pgp} from 'infrastructure/db';
import {TenantsRouter} from 'modules/tenants/infrastructure/http';
import {FormsRouter} from 'modules/forms/infrastructure/http';
import {FormSubmissionRouter} from 'modules/formSubmissions/infrastructure/http';
import {MembersRouter} from 'modules/members/infrastructure/http';
import {SubscriptionsRouter} from 'modules/subscriptions/infrastructure/http';
import {JobsRouter} from 'modules/jobs/infrastructure/http';
import {ApplicantsRouter} from 'modules/applicants/infrastructure/http';
import {RankingsRouter} from 'modules/rankings/infrastructure/http';
import {Applicant, ApplicantStatus, createApplicant} from 'modules/applicants/domain';
import {Report} from 'modules/applicants/application/calcReport/report';
import {JobRequirement} from 'modules/jobs/domain';
import puppeteer from 'puppeteer';
import pug from 'pug';

const router = express.Router();

router.use('/tenants', TenantsRouter({db, pgp}));
router.use('/members', MembersRouter({db, pgp}));
router.use('/subscriptions', SubscriptionsRouter({db, pgp}));
router.use('/jobs', JobsRouter({db, pgp}));
router.use('/forms', FormsRouter({db, pgp}));
router.use('/form-submissions', FormSubmissionRouter({db, pgp}));
router.use('/applicants', ApplicantsRouter({db, pgp}));
router.use('/rankings', RankingsRouter({db, pgp}));
router.use('/pdf', async (req, res) => {
  const applicant: Applicant = createApplicant({
    applicantStatus: 'confirmed' as ApplicantStatus,
    jobId: '1',
    files: [],
    attributes: [
      {formFieldId: 'Vollständiger Name', value: 'Maria Reinhardt'},
      {formFieldId: 'E-Mail-Adresse', value: ''},
    ],
  });

  const jobRequirements: JobRequirement[] = [
    {id: 'strukturiertheit', requirementLabel: 'Strukturiertheit'},
    {id: 'professionalitaet', requirementLabel: 'Professionalität'},
  ];

  const report: Report = {
    rank: 7,
    formCategory: 'assessment' as 'assessment',
    formCategoryScore: 1,
    formResults: [
      {
        formId: 'leidenschaftspraesentation',
        formTitle: '1 - Leidenschaftspräsentation',
        formScore: 0,
        possibleMinFormScore: 0,
        possibleMaxFormScore: 0,
        formFieldScores: [
          {
            formFieldId: 'verstaendnis_thema',
            jobRequirementId: 'strukturiertheit',
            rowIndex: 0,
            intent: 'sum_up' as 'sum_up',
            label: 'Der*Die Bewerber*in versteht es sein Thema der Zuhörerschaft zu präsentieren.*',
            aggregatedValues: [],
            countDistinct: {},
            formFieldScore: 4,
            stdDevFormFieldScore: 0.25,
          },
          {
            formFieldId: 'dresscode',
            jobRequirementId: 'professionalitaet',
            rowIndex: 0,
            intent: 'sum_up' as 'sum_up',
            label: 'Der*Die Bewerber*in ist des Dresscodes entsprechend gekleidet.*',
            aggregatedValues: [],
            countDistinct: {},
            formFieldScore: 3,
            stdDevFormFieldScore: 0,
          },

          {
            formFieldId: 'dresscode',
            jobRequirementId: 'professionalitaet',
            rowIndex: 0,
            intent: 'sum_up' as 'sum_up',
            label: 'Der*Die Bewerber*in achtet auf zeitliche Rahmenbedingungen.*',
            aggregatedValues: [],
            countDistinct: {},
            formFieldScore: 1,
            stdDevFormFieldScore: 2.5,
          },
          {
            formFieldId: 'dresscode',
            jobRequirementId: 'professionalitaet',
            rowIndex: 0,
            intent: 'sum_up' as 'sum_up',
            label:
              'Der*die Bewerberin kann Fragen zum Thema seiner*ihrer Präsentation detailreich beantworten.*',
            aggregatedValues: [],
            countDistinct: {},
            formFieldScore: 4,
            stdDevFormFieldScore: 0,
          },
          {
            formFieldId: 'dresscode',
            jobRequirementId: 'professionalitaet',
            rowIndex: 0,
            intent: 'sum_up' as 'sum_up',
            label: 'Der*die Bewerber*in präsentiert sein*ihr Thema auf eine originelle Weise.*',
            aggregatedValues: [],
            countDistinct: {},
            formFieldScore: 3.25,
            stdDevFormFieldScore: 1.25,
          },
          {
            formFieldId: 'dresscode',
            jobRequirementId: 'professionalitaet',
            rowIndex: 0,
            intent: 'sum_up' as 'sum_up',
            label: 'Der*Die Bewerber*in kann sich für eine Sache begeistern.*',
            aggregatedValues: [],
            countDistinct: {},
            formFieldScore: 2,
            stdDevFormFieldScore: 1,
          },
          {
            formFieldId: 'dresscode',
            jobRequirementId: 'professionalitaet',
            rowIndex: 0,
            intent: 'sum_up' as 'sum_up',
            label: 'Der*Die Bewerber*in ist motiviert sich selber weiterzuentwickeln.*',
            aggregatedValues: [],
            countDistinct: {},
            formFieldScore: 4,
            stdDevFormFieldScore: 0.25,
          },
          {
            formFieldId: 'dresscode',
            jobRequirementId: 'professionalitaet',
            rowIndex: 0,
            intent: 'sum_up' as 'sum_up',
            label: 'Der Ablauf der Präsentation ist strukturiert und nachvollziehbar.*',
            aggregatedValues: [],
            countDistinct: {},
            formFieldScore: 2,
            stdDevFormFieldScore: 0,
          },
          {
            formFieldId: 'dresscode',
            jobRequirementId: 'professionalitaet',
            rowIndex: 0,
            intent: 'sum_up' as 'sum_up',
            label: 'Ich würde mit der*dem Bewerber*in ein Bier trinken gehen.*',
            aggregatedValues: [],
            countDistinct: {},
            formFieldScore: 2.75,
            stdDevFormFieldScore: 0.15,
          },
          {
            formFieldId: 'dresscode',
            jobRequirementId: 'professionalitaet',
            rowIndex: 0,
            intent: 'sum_up' as 'sum_up',
            label: 'Mir hat an der*dem Bewerber*in etwas ganz besonders gut gefallen.*',
            aggregatedValues: [],
            countDistinct: {},
            formFieldScore: 3,
            stdDevFormFieldScore: 1.25,
          },
          {
            formFieldId: 'dresscode',
            jobRequirementId: 'professionalitaet',
            rowIndex: 0,
            intent: 'sum_up' as 'sum_up',
            label: 'Wenn ja, bitte ausführen, was die*den Bewerber*in auszeichnet.*',
            aggregatedValues: [],
            countDistinct: {},
            formFieldScore: 3,
            stdDevFormFieldScore: 1.25,
          },
          {
            formFieldId: 'dresscode',
            jobRequirementId: 'professionalitaet',
            rowIndex: 0,
            intent: 'count_distinct',
            label: 'Gesamteindruck*',
            aggregatedValues: [],
            countDistinct: {'Strong Hire': 3, Hire: 2, Decline: 1, 'Strong Decline': 1},
            formFieldScore: 2,
            stdDevFormFieldScore: 1.25,
          },
          {
            formFieldId: 'positive_behaviour',
            jobRequirementId: 'professionalitaet',
            rowIndex: 0,
            intent: 'aggregate',
            label: 'Welche Verhaltensweisen soll der/die Bewerber:in beibehalten?*',
            aggregatedValues: [
              'Sehr aussdrucksstarke Gestik. Ist sicher eine geübte Rednerin!',
              'Unglaubliche Wortgewandtheit. Hat mich sehr beeindruckt!',
              'Ihr ausgepsrochene eleganter Haarschmuck hat ich absolut überzeugt. Strong strong hire.',
            ],
            countDistinct: {},
            formFieldScore: 4,
            stdDevFormFieldScore: 0.34,
          },
          {
            formFieldId: 'dresscode',
            jobRequirementId: 'professionalitaet',
            rowIndex: 0,
            intent: 'count_distinct',
            label: 'Welche Verhaltensweisen soll der/die Bewerber:in verändern?*',
            aggregatedValues: [],
            countDistinct: {},
            formFieldScore: 2.85,
            stdDevFormFieldScore: 0.45,
          },
          {
            formFieldId: 'dresscode',
            jobRequirementId: 'professionalitaet',
            rowIndex: 0,
            intent: 'count_distinct',
            label: 'Weitere Anmerkungen:',
            aggregatedValues: [],
            countDistinct: {},
            formFieldScore: 4,
            stdDevFormFieldScore: 0.25,
          },
        ],
      },
      {
        formId: 'lebenslauf',
        formTitle: '2 - Lebenslauf',
        formScore: 1,
        possibleMinFormScore: 0,
        possibleMaxFormScore: 1,
        formFieldScores: [
          {
            formFieldId: 'dresscode',
            jobRequirementId: 'professionalitaet',
            rowIndex: 0,
            intent: 'sum_up',
            label: '...',
            aggregatedValues: [],
            countDistinct: {},
            formFieldScore: 0,
            stdDevFormFieldScore: 0,
          },
        ],
      },
    ],
    jobRequirementResults: [
      {
        jobRequirementId: 'strukturiertheit',
        requirementLabel: 'Strukturiertheit',
        jobRequirementScore: 1,
      },
      {
        jobRequirementId: 'professionalitaet',
        requirementLabel: 'Professionalität',
        jobRequirementScore: 1,
      },
    ],
  };

  const _applicant = {...applicant};
  const fullName = _applicant.attributes?.find(
    (attr) => attr.formFieldId === 'Vollständiger Name',
  )?.value;

  const template = pug.compileFile(`${__dirname}/views/report.pug`)({
    applicant: {...applicant, name: fullName},
    report,
    formCategory: 'assessment',
  });

  // return res.send(template);

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(template, {waitUntil: 'networkidle0'});
  await page.pdf({
    path: 'report.pdf',
    format: 'A4',
    displayHeaderFooter: true,
    headerTemplate: ``,
    footerTemplate: `
    <div style="border-top: solid 1px #bbb; width: 100%; font-size: 12px;
        padding: 5px 5px 0; color: #bbb; position: relative;">
        <div style="position: absolute; right: 5px; top: 5px;"><span class="pageNumber"></span>/<span class="totalPages"></span></div>
    </div>
  `,
    // this is needed to prevent content from being placed over the footer
    margin: {top: '24px', bottom: '24px'},
  });
  await browser.close();
  res.json('PDF generated');
});

router.get('/health', (req, res) => {
  res.json('Everything Up And Running! 🎉');
});

// // This route exists for easier development of email .pug templates
// router.get('/mail', (req, res, next) => {
//   res.render('application-confirmation-email');
// });

export {router as routes};
