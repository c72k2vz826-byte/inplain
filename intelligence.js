const loan=['Home loan','Personal loan','Car loan'];
const signing=[...loan,'Before you sign','Agreements'];
const rules=[
[signing,/non[- ]?refundable/i,'Refund conditions','Check which fees you lose if the application is rejected or withdrawn.','Is this fee refundable?'],
[loan,/floating rate|variable rate|interest rate reset/i,'Rate changes','A variable rate can change your EMI or repayment period.','Will my EMI or tenure change?'],
[loan,/foreclosure|prepayment/i,'Early repayment','The document mentions early repayment. Check applicable conditions and charges.','What would early closure cost?'],
[loan,/processing fee/i,'Processing fee','This is a separate borrowing cost; check whether tax is additional.','What is the total fee including tax?'],
[loan,/annual percentage rate|\bAPR\b/i,'Annual borrowing cost','APR expresses annualised borrowing cost including applicable charges.','Can I see the Key Facts Statement?'],
[signing,/credit bureau|credit information|cibil/i,'Credit checks','Review the scope of credit information access.','What information will be shared and with whom?'],
[signing,/insurance premium|credit life/i,'Insurance','Check whether insurance is optional and financed through the loan.','Can I decline this insurance?'],
[signing,/auto.debit|standing instruction|\bNACH\b/i,'Automatic payments','Check the debit amount, frequency and cancellation terms.','What debit authority am I granting?'],
[signing,/indemnif/i,'Indemnity','This clause may allocate responsibility for certain losses. Read its scope and exceptions.','Which losses would I be responsible for?'],
[signing,/personal data|marketing consent|third.part(y|ies)/i,'Data sharing','Check the purpose, recipients and duration of data permissions.','Which permissions are optional?'],
[loan,/penal charges|late payment/i,'Missed payments','Check the stated charge and when it applies.','How are overdue charges calculated?'],
[loan,/loan recall|acceleration/i,'Early demand for repayment','Check circumstances in which the lender may demand repayment before maturity.','What events trigger this clause?'],
[['Credit card bill'],/minimum (amount )?due/i,'Minimum payment','Paying only the minimum can leave an interest-bearing balance.','What is the full amount due?'],
[['Credit card bill'],/finance charges|interest charges/i,'Interest charges','Check the rate, balance and period used to calculate interest.','How was this interest calculated?'],
[['Credit card bill'],/cash advance/i,'Cash advances','Cash withdrawals can have separate fees and interest terms.','What charges apply to cash withdrawals?'],
[['Credit card bill'],/late payment/i,'Late payment','Check the stated due date and late fee.','Has my last payment been credited?'],
[['Insurance policy'],/waiting period/i,'Waiting period','Some benefits may not be available until a specified period has passed.','Which conditions have waiting periods?'],
[['Insurance policy'],/exclusion/i,'Exclusions','Review situations that are not covered.','Which exclusions affect my needs?'],
[['Insurance policy'],/co.payment|deductible/i,'Your share of a claim','Check what portion of eligible costs you must pay yourself.','How much would I pay on a claim?'],
[['Insurance policy'],/sub.limit|room rent/i,'Coverage limits','A benefit may have a limit below the overall sum insured.','Which benefits have separate caps?'],
[['Insurance policy'],/free.look/i,'Review period','Check the stated cancellation window and deductions.','When does the review period begin?'],
[['Legal notices'],/sarfaesi|arbitration|summons|demand notice|loan recall/i,'Nature of notice','The sender may be asserting a claim or initiating a process. A keyword alone cannot establish the legal stage.','What response is required and by when?'],
[['Legal notices'],/outstanding|arrears|overdue/i,'Amount claimed','The sender claims an outstanding liability; verify it against your records.','Can I obtain an itemised statement?'],
[['Legal notices'],/within\s+\d+\s+days/i,'Response period','A response period is mentioned. Its legal start date must be verified.','When does this period legally begin?'],
[['Agreements','Before you sign'],/termination|notice period/i,'Ending the agreement','Check notice requirements, fees and continuing obligations.','What happens if I exit early?'],
[['Agreements','Before you sign'],/automatic renewal|auto.renew/i,'Renewal','Check whether renewal occurs automatically and how to opt out.','How do I prevent renewal?']
];
export function review(category,pages){return rules.filter(([cats])=>cats.includes(category)).flatMap(([,re,title,meaning,question])=>{const p=pages.find(p=>re.test(p.text));if(!p)return [];const i=p.text.search(re);return [{title,meaning,question,page:p.page,name:p.name,evidence:p.text.slice(Math.max(0,i-60),i+150)}]})}
export function emi(principal,annualRate,months){if(!Number.isFinite(principal)||!Number.isFinite(annualRate)||!Number.isInteger(months)||principal<=0||annualRate<0||months<=0)return null;const r=annualRate/1200;return r===0?principal/months:principal*r/-Math.expm1(-months*Math.log1p(r))}
export function classify(text){const types=[['Key Facts Statement',/key facts statement/i],['Sanction letter',/sanction letter/i],['Loan application',/loan application form/i],['Repayment schedule',/repayment schedule|amortisation schedule/i],['Loan agreement',/loan agreement/i],['Demand notice',/demand notice/i],['Credit card statement',/credit card statement/i],['Insurance policy',/policy schedule/i]];const found=types.filter(([,re])=>re.test(text));return found.length===1?found[0][0]:null}
