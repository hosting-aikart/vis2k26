// The three multi-step forms. They are in preview mode: answers are kept on this
// device as a draft, and nothing is sent or charged until a backend is connected.
(() => {
  const DOMAINS = ['Artificial Intelligence', 'Robotics', 'Defence Technology', 'Cyber Security', 'Drones', 'Internet of Things', 'Agriculture', 'Healthcare', 'Education', 'Fintech', 'Electric Vehicles and Energy', 'Food Processing'];
  const SECTORS = [...DOMAINS, 'Textiles', 'Consumer and Retail', 'Other'];
  const DISTRICTS = ['Akola', 'Amravati', 'Bhandara', 'Buldhana', 'Chandrapur', 'Gadchiroli', 'Gondia', 'Nagpur', 'Wardha', 'Washim', 'Yavatmal'];
  const DECK = { accept: '.pdf,.ppt,.pptx', maxMb: 10, label: 'Upload your pitch deck', hint: 'PDF, PPT or PPTX, up to 10 MB' };
  const MOBILE = { t: 'tel', pattern: '[6-9][0-9]{9}', max: 10, inputmode: 'numeric', msg: 'Enter a 10-digit mobile number.' };
  const year = new Date().getFullYear();
  const yearField = { t: 'number', min: 1950, maxValue: year };
  const startupOnly = (v) => v.participant_type === 'startup';
  const collegeOnly = (v) => v.participant_type === 'college';

  const FORMS = {
    hackathon: {
      done: 'Your entry is complete',
      aside: [
        { h: 'Keep these ready', list: ['Team and contact details', 'Your domain and problem', 'Pitch deck (PDF, PPT or PPTX)', '₹1,499 for the online payment'] },
        { h: 'What happens next', pairs: [['Screening', 'Entries are reviewed as they arrive.'], ['Online round', 'Second week of December.'], ['Physical round', 'About 15 teams in Amravati.'], ['Grand finale', 'Before Summit Day.']] },
      ],
      steps: [
        {
          title: 'Team details',
          next: 'Continue to payment',
          items: [
            { n: 'participant_type', l: 'You are registering as', t: 'radio', req: true, opts: [['college', 'College students', 'A team from a college or university'], ['startup', 'Startup', 'Up to 12 years old, revenue under ₹100 crore']] },
            { n: 'team', l: 'Team name', req: true, max: 80 },
            {
              repeat: 'member', l: 'Team members', noun: 'team members', one: 'Member', firstTag: 'Team leader', limit: 5, add: 'Add team member',
              hint: 'Add each member in their own box, starting with the team leader. Up to 5 members per team.',
              fields: [
                { n: 'name', l: 'Full name', req: true, max: 80 },
                { n: 'email', l: 'Email', t: 'email', req: true },
                { n: 'mobile', l: 'Mobile number', req: true, ...MOBILE },
                { n: 'course', l: 'Course and year', req: true, max: 60, ph: 'e.g. B.Tech, 3rd year', when: collegeOnly },
                { n: 'role', l: 'Role in the startup', req: true, max: 60, ph: 'e.g. CTO', when: startupOnly },
              ],
            },
            { n: 'college', l: 'College or institute', req: true, max: 120, when: collegeOnly },
            { n: 'startup', l: 'Startup name', req: true, max: 120, when: startupOnly },
            { n: 'year', l: 'Year of incorporation', req: true, ...yearField, min: year - 12, msg: `Startups must be up to 12 years old (${year - 12} or later).`, when: startupOnly },
            { n: 'revenue_under_100cr', l: 'Our annual revenue is under ₹100 crore', t: 'check', req: true, when: startupOnly },
            { n: 'from_vidarbha', l: 'Is your team from Vidarbha?', t: 'radio', req: true, opts: [['yes', 'Yes'], ['no', 'No']] },
            { n: 'district', l: 'District', t: 'select', req: true, ph: 'Select district', opts: DISTRICTS, when: (v) => v.from_vidarbha === 'yes' },
            { n: 'city', l: 'City', req: true, max: 80, when: (v) => v.from_vidarbha === 'no' },
            { n: 'state', l: 'State', req: true, max: 80, when: (v) => v.from_vidarbha === 'no' },
            { info: 'Teams from outside Vidarbha are welcome, as long as the solution addresses a Vidarbha problem.', when: (v) => v.from_vidarbha === 'no' },
          ],
        },
        {
          title: 'Payment',
          next: 'Pay ₹1,499',
          items: [
            { fee: ['Hackathon registration fee', '₹1,499'], note: 'An early-bird price applies to the first 100 teams and will be shown at checkout.' },
            { n: 'agree_rules', l: 'I have read the hackathon details and agree to the rules', t: 'check', req: true },
            { n: 'agree_vidarbha', l: 'Our solution will address a problem in Vidarbha', t: 'check', req: true },
          ],
        },
        {
          title: 'Idea and pitch deck',
          next: 'Submit entry',
          items: [
            { n: 'domain', l: 'Domain', t: 'select', req: true, ph: 'Select your domain', opts: [...DOMAINS, 'Smart Governance', 'Other'], hint: 'Your entry is judged by experts from this domain.' },
            { n: 'domain_other', l: 'Your domain', req: true, max: 80, when: (v) => v.domain === 'Other' },
            { n: 'stage', l: 'Current stage', t: 'select', req: true, ph: 'Select stage', opts: ['Idea', 'Prototype in progress', 'Working prototype', 'Pilot running'] },
            { n: 'title', l: 'Problem title', req: true, max: 120 },
            { n: 'problem', l: 'The problem in Vidarbha', t: 'area', req: true, minLen: 50, max: 1000, ph: 'Who faces it, where, and why it matters' },
            { n: 'solution', l: 'Your solution', t: 'area', req: true, minLen: 50, max: 1000, ph: 'What you are building and how it works' },
            { n: 'pitch_deck', l: 'Pitch deck', t: 'file', req: true, ...DECK },
            { n: 'link', l: 'Demo video or code link', t: 'url', ph: 'https://' },
          ],
        },
      ],
    },

    pitching: {
      done: 'Your application is complete',
      aside: [
        { h: 'Keep these ready', list: ['Company registration details', 'Revenue and funding figures', 'Pitch deck (PDF, PPT or PPTX)'] },
        { h: 'Timeline', pairs: [['Applications open', 'First week of November.'], ['Applications close', 'First week of December.'], ['Screening pitch', '3 to 4 minutes.'], ['Shortlist', 'At least 8 days before the summit.']] },
      ],
      steps: [
        {
          title: 'Startup and founder',
          next: 'Continue',
          blockIf: (v) => v.private_limited === 'no',
          items: [
            { n: 'name', l: 'Startup name', req: true, max: 120 },
            { n: 'web', l: 'Website', t: 'url', ph: 'https://' },
            {
              repeat: 'founder', l: 'Founders', noun: 'founders', one: 'Founder', firstTag: 'Main contact', limit: 4, add: 'Add co-founder',
              hint: 'Add each founder in their own box. Founder 1 is the main contact for the application.',
              fields: [
                { n: 'name', l: 'Full name', req: true, max: 80 },
                { n: 'designation', l: 'Designation', req: true, max: 60, ph: 'e.g. Founder and CEO' },
                { n: 'email', l: 'Email', t: 'email', req: true },
                { n: 'mobile', l: 'Mobile number', req: true, ...MOBILE },
                { n: 'linkedin', l: 'LinkedIn profile', t: 'url', ph: 'https://' },
              ],
            },
            { n: 'city', l: 'City', req: true, max: 80 },
            { n: 'state', l: 'State', req: true, max: 80 },
            { n: 'private_limited', l: 'Is your startup registered as a Private Limited company?', t: 'radio', req: true, opts: [['yes', 'Yes'], ['no', 'No']] },
            { info: 'Private Limited registration is required to pitch to investors. You can still apply for an expo stall.', when: (v) => v.private_limited === 'no' },
            { n: 'cin', l: 'CIN', max: 21, ph: '21-character company number', when: (v) => v.private_limited === 'yes' },
            { n: 'year', l: 'Year of incorporation', req: true, ...yearField, when: (v) => v.private_limited === 'yes' },
            { n: 'dpiit', l: 'DPIIT recognition', t: 'radio', req: true, opts: [['recognised', 'Recognised'], ['applied', 'Applied'], ['not-yet', 'Not yet']], hint: 'Not required. SRIF will help selected startups obtain it.', when: (v) => v.private_limited === 'yes' },
          ],
        },
        {
          title: 'Business',
          next: 'Continue',
          items: [
            { n: 'sector', l: 'Sector', t: 'select', req: true, ph: 'Select sector', opts: SECTORS },
            { n: 'stage', l: 'Stage', t: 'select', req: true, ph: 'Select stage', opts: ['Idea', 'MVP', 'Early revenue', 'Growth'] },
            { n: 'team', l: 'Total team size', t: 'number', req: true, min: 1 },
            { n: 'rev', l: 'Revenue in the last financial year', t: 'select', req: true, ph: 'Select', opts: ['Pre-revenue', 'Under ₹10 lakh', '₹10 lakh to ₹1 crore', '₹1 crore to ₹10 crore', 'Above ₹10 crore'] },
            { n: 'funded', l: 'Funding raised so far', t: 'select', req: true, ph: 'Select', opts: ['Bootstrapped', 'Grants', 'Angel', 'Seed', 'Series A or later'] },
            { n: 'ask', l: 'Amount you want to raise', t: 'select', req: true, ph: 'Select', opts: ['Under ₹50 lakh', '₹50 lakh to ₹2 crore', '₹2 crore to ₹10 crore', 'Above ₹10 crore'] },
            { n: 'oneline', l: 'One-line pitch', req: true, max: 160, ph: 'What you do, for whom, in one sentence' },
            { n: 'problem', l: 'Problem', t: 'area', req: true, max: 800 },
            { n: 'solution', l: 'Solution and product', t: 'area', req: true, max: 800 },
            { n: 'traction', l: 'Traction', t: 'area', max: 600, ph: 'Customers, revenue, pilots, partnerships' },
          ],
        },
        {
          title: 'Pitch deck',
          next: 'Submit application',
          items: [
            { n: 'pitch_deck', l: 'Pitch deck', t: 'file', req: true, ...DECK },
            { n: 'video', l: 'Pitch or product video link', t: 'url', ph: 'https://' },
            { n: 'wants_stall', l: 'We would also like a stall at the expo', t: 'check' },
            { n: 'agree_screening', l: 'If shortlisted, we will give a 3 to 4 minute screening pitch', t: 'check', req: true },
            { n: 'agree_accurate', l: 'The information in this application is accurate', t: 'check', req: true },
          ],
        },
      ],
    },

    stall: {
      done: 'Your stall request is complete',
      aside: [
        { h: 'Each stall gets', list: ['Stall space in the expo hall', 'Room for live demos', 'Space for pamphlets and a QR code'] },
        { h: 'Good to know', text: 'Expo space is planned at about 70% startups and 30% incubators. Stall details, including any fee, are shared with selected exhibitors.' },
      ],
      steps: [
        {
          title: 'Exhibitor',
          next: 'Continue',
          items: [
            { n: 'exhibitor_type', l: 'You are', t: 'radio', req: true, opts: [['startup', 'A startup'], ['incubator', 'An incubator'], ['other', 'Another organisation']] },
            { n: 'org', l: 'Organisation name', req: true, max: 120 },
            { n: 'web', l: 'Website', t: 'url', ph: 'https://' },
            { n: 'inctype', l: 'Incubator type', t: 'select', req: true, ph: 'Select', opts: ['Government', 'University', 'Private'], when: (v) => v.exhibitor_type === 'incubator' },
            { n: 'host', l: 'Host institution', max: 120, when: (v) => v.exhibitor_type === 'incubator' },
            { n: 'sector', l: 'Sector', t: 'select', req: true, ph: 'Select sector', opts: SECTORS, when: (v) => v.exhibitor_type === 'startup' },
            { n: 'year', l: 'Year of incorporation', ...yearField, when: (v) => v.exhibitor_type === 'startup' },
            { n: 'contact', l: 'Contact person', req: true, max: 80 },
            { n: 'role', l: 'Designation', req: true, max: 60 },
            { n: 'email', l: 'Email', t: 'email', req: true },
            { n: 'phone', l: 'Mobile number', req: true, ...MOBILE },
            { n: 'city', l: 'City', req: true, max: 80 },
          ],
        },
        {
          title: 'Stall and demo',
          next: 'Submit request',
          items: [
            { n: 'show', l: 'What will you show at your stall?', t: 'area', req: true, max: 800, ph: 'Products, prototypes or programmes you will present' },
            { n: 'demo_type', l: 'Demo type', t: 'radio', req: true, opts: [['software', 'Software'], ['hardware', 'Hardware'], ['both', 'Both'], ['none', 'No live demo']] },
            { n: 'needs', l: 'You will need', t: 'multi', opts: ['Power socket', 'Table', 'Screen or TV', 'Internet'] },
            {
              repeat: 'rep', l: 'Stall representatives', noun: 'representatives', one: 'Representative', limit: 3, add: 'Add representative',
              hint: 'Add each person who will be at your stall, in their own box. Up to 3.',
              fields: [
                { n: 'name', l: 'Full name', req: true, max: 80 },
                { n: 'mobile', l: 'Mobile number', req: true, ...MOBILE },
                { n: 'designation', l: 'Designation', max: 60 },
              ],
            },
            { n: 'logo', l: 'Logo', t: 'file', req: true, accept: '.png,.jpg,.jpeg,.svg', maxMb: 2, label: 'Upload logo', hint: 'PNG, JPG or SVG, up to 2 MB' },
            { n: 'brochure', l: 'Brochure', t: 'file', accept: '.pdf', maxMb: 10, label: 'Upload brochure', hint: 'PDF, up to 10 MB' },
            { n: 'notes', l: 'Anything else we should know', t: 'area', max: 400 },
            { n: 'agree_stall', l: 'A representative will be at the stall for the full expo, 9:00 AM to 7:00 PM', t: 'check', req: true },
          ],
        },
      ],
    },
  };

  const el = (tag, attrs = {}, ...children) => {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (value === undefined || value === false) return;
      if (key === 'text') node.textContent = value;
      else node.setAttribute(key, value === true ? '' : value);
    });
    node.append(...children.filter(Boolean));
    return node;
  };

  const store = {
    read(key) {
      try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; }
    },
    write(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Drafts are only a convenience. */ }
    },
    clear(key) {
      try { localStorage.removeItem(key); } catch { /* Nothing to clear. */ }
    },
  };

  function buildForm(host, name, config) {
    const key = `vis2k26-${name}`;
    const draft = store.read(key);
    const values = draft.values || {};
    const counts = draft.counts || {};
    let current = 0;
    let uid = 0;

    const form = el('form', { class: 'vform', novalidate: true });
    const save = () => store.write(key, { values, counts });

    function label(field, id) {
      const node = el('label', { class: 'field__label', for: id, text: field.l });
      if (field.req) node.append(el('span', { class: 'req', 'aria-hidden': 'true', text: ' *' }));
      return node;
    }

    function control(field, id, saveName) {
      const stored = values[saveName];
      const common = {
        id, name: saveName, required: field.req, placeholder: field.ph, maxlength: field.max, pattern: field.pattern, inputmode: field.inputmode,
      };
      if (field.t === 'select') {
        const select = el('select', { id, name: saveName, required: field.req }, el('option', { value: '', text: field.ph }));
        field.opts.forEach((option) => select.append(el('option', { value: option, text: option, selected: stored === option })));
        return select;
      }
      if (field.t === 'area') {
        const area = el('textarea', { ...common, rows: 4, minlength: field.minLen });
        area.value = stored || '';
        return area;
      }
      const input = el('input', { ...common, type: field.t || 'text', min: field.min, max: field.maxValue });
      input.value = stored || '';
      return input;
    }

    function renderField(field, saveName = field.n) {
      const id = `${name}-${saveName}-${uid++}`;
      const wrap = el('div', { class: 'field', 'data-field': true });
      wrap.when = field.when;
      wrap.spec = field;

      if (field.info) {
        wrap.classList.add('field--wide');
        wrap.append(el('p', { class: 'field__info', text: field.info }));
        return wrap;
      }

      if (field.fee) {
        wrap.classList.add('field--wide');
        wrap.append(
          el('p', { class: 'fee' }, el('span', { text: field.fee[0] }), el('b', { text: field.fee[1] })),
          el('p', { class: 'field__hint', text: field.note }),
        );
        return wrap;
      }

      if (field.t === 'radio') {
        wrap.classList.add('field--wide');
        const group = el('div', { class: 'choices', role: 'radiogroup', 'aria-label': field.l });
        field.opts.forEach(([value, title, detail]) => {
          const input = el('input', { type: 'radio', name: saveName, value, required: field.req, checked: values[saveName] === value });
          group.append(el('label', { class: 'choice' }, input, el('span', {}, el('b', { text: title }), detail && el('small', { text: detail }))));
        });
        wrap.append(el('p', { class: 'field__label', text: field.l }), group);
        if (field.req) wrap.firstChild.append(el('span', { class: 'req', 'aria-hidden': 'true', text: ' *' }));
      } else if (field.t === 'check') {
        wrap.classList.add('field--wide');
        wrap.append(el('label', { class: 'check' }, el('input', { type: 'checkbox', name: saveName, required: field.req, checked: values[saveName] === true }), el('span', { text: `${field.l}${field.req ? ' *' : ''}` })));
      } else if (field.t === 'multi') {
        wrap.classList.add('field--wide');
        const picked = values[saveName] || [];
        const group = el('div', { class: 'choices' });
        field.opts.forEach((option) => {
          group.append(el('label', { class: 'check' }, el('input', { type: 'checkbox', name: saveName, value: option, checked: picked.includes(option) }), el('span', { text: option })));
        });
        wrap.append(el('p', { class: 'field__label', text: field.l }), group);
      } else if (field.t === 'file') {
        wrap.classList.add('field--wide');
        const input = el('input', { id, type: 'file', name: saveName, accept: field.accept, required: field.req, class: 'sr' });
        const chosen = el('small', { text: field.hint });
        input.addEventListener('change', () => { chosen.textContent = input.files[0]?.name || field.hint; });
        wrap.append(label(field, id), el('label', { class: 'upload', for: id }, el('b', { text: field.label }), chosen), input);
      } else {
        if (field.t === 'area') wrap.classList.add('field--wide');
        const input = control(field, id, saveName);
        wrap.append(label(field, id), input);
        if (field.t === 'area') {
          const counter = el('small', { class: 'field__count', text: `${input.value.length} / ${field.max}` });
          input.addEventListener('input', () => { counter.textContent = `${input.value.length} / ${field.max}`; });
          wrap.append(counter);
        }
        if (field.hint) wrap.append(el('p', { class: 'field__hint', text: field.hint }));
      }
      if (field.t === 'radio' && field.hint) wrap.append(el('p', { class: 'field__hint', text: field.hint }));
      wrap.append(el('p', { class: 'err', role: 'alert' }));
      return wrap;
    }

    function renderRepeat(group) {
      const wrap = el('div', { class: 'field field--wide repeat' });
      const list = el('div', { class: 'repeat__list' });
      const count = el('span', { class: 'repeat__count' });
      const addButton = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', text: group.add });

      const draw = () => {
        const total = counts[group.repeat] || 1;
        list.replaceChildren();
        for (let i = 1; i <= total; i++) {
          const box = el('div', { class: 'repeat__box' });
          const head = el('div', { class: 'repeat__head' }, el('b', { text: `${group.one} ${i}` }));
          if (i === 1 && group.firstTag) head.append(el('span', { class: 'tag', text: group.firstTag }));
          if (i > 1) {
            head.append(el('button', { type: 'button', class: 'linkbtn', text: 'Remove', 'data-remove': i }));
          }
          const grid = el('div', { class: 'fields' });
          group.fields.forEach((field) => grid.append(renderField(field, `${group.repeat}_${i}_${field.n}`)));
          box.append(head, grid);
          list.append(box);
        }
        count.textContent = `${total} of ${group.limit} ${group.noun}`;
        addButton.hidden = total >= group.limit;
        refresh();
      };

      list.addEventListener('click', (event) => {
        const index = Number(event.target.dataset.remove);
        if (!index) return;
        const total = counts[group.repeat];
        // Close the gap so the remaining people keep their answers.
        for (let i = index; i < total; i++) {
          group.fields.forEach(({ n }) => { values[`${group.repeat}_${i}_${n}`] = values[`${group.repeat}_${i + 1}_${n}`]; });
        }
        group.fields.forEach(({ n }) => { delete values[`${group.repeat}_${total}_${n}`]; });
        counts[group.repeat] = total - 1;
        save();
        draw();
      });

      addButton.addEventListener('click', () => {
        counts[group.repeat] = (counts[group.repeat] || 1) + 1;
        save();
        draw();
      });

      wrap.append(el('p', { class: 'field__label' }, group.l, el('span', { class: 'req', 'aria-hidden': 'true', text: ' *' })), count, el('p', { class: 'field__hint', text: group.hint }), list, addButton);
      wrap.draw = draw;
      return wrap;
    }

    // Conditional fields are disabled as well as hidden, so they skip validation.
    function refresh() {
      form.querySelectorAll('[data-field]').forEach((field) => {
        const show = field.when ? Boolean(field.when(values)) : true;
        field.hidden = !show;
        field.querySelectorAll('input, select, textarea').forEach((input) => { input.disabled = !show; });
      });
      form.querySelectorAll('.fstep').forEach((step, i) => {
        const button = step.querySelector('[data-next]');
        if (button) button.disabled = Boolean(config.steps[i].blockIf?.(values));
      });
    }

    function showStep(index) {
      current = index;
      form.querySelectorAll('.fstep').forEach((step, i) => { step.hidden = i !== index; });
      form.querySelectorAll('.stepper li').forEach((item, i) => {
        item.classList.toggle('is-active', i === index);
        item.classList.toggle('is-done', i < index);
      });
      const top = host.getBoundingClientRect().top + scrollY - 96;
      if (scrollY > top) scrollTo({ top, behavior: 'instant' });
    }

    function messageFor(input, field) {
      if (input.type === 'file') {
        const file = input.files[0];
        if (!file) return input.required ? 'Please choose a file.' : '';
        const ext = `.${file.name.split('.').pop().toLowerCase()}`;
        if (!field.accept.split(',').includes(ext)) return `Use one of these file types: ${field.hint.split(',')[0]}.`;
        if (file.size > field.maxMb * 1024 * 1024) return `This file is over ${field.maxMb} MB.`;
        return '';
      }
      if (input.validity.valid) return '';
      if (input.validity.valueMissing) return 'This field is required.';
      if (field.msg) return field.msg;
      if (input.validity.tooShort) return `Please write at least ${field.minLen} characters.`;
      if (input.validity.typeMismatch && input.type === 'email') return 'Enter a valid email address.';
      if (input.validity.typeMismatch && input.type === 'url') return 'Enter a full link starting with https://';
      return 'Please check this field.';
    }

    function validate(stepNode) {
      let firstBad = null;
      stepNode.querySelectorAll('[data-field]:not([hidden])').forEach((wrap) => {
        const error = wrap.querySelector('.err');
        if (!error) return;
        const inputs = [...wrap.querySelectorAll('input, select, textarea')];
        const problems = inputs.map((input) => messageFor(input, wrap.spec)).filter(Boolean);
        const anyChecked = inputs[0]?.type === 'radio' && inputs.some((input) => input.checked);
        const message = anyChecked ? '' : problems[0] || '';
        error.textContent = message;
        inputs.forEach((input) => input.toggleAttribute('aria-invalid', Boolean(message)));
        if (message && !firstBad) firstBad = inputs[0];
      });
      firstBad?.focus();
      return !firstBad;
    }

    function finish() {
      store.clear(key);
      const panel = el(
        'div',
        { class: 'vdone', tabindex: '-1' },
        el('h2', { text: config.done }),
        el('p', { class: 'lead', text: 'This form is in preview mode, so nothing was sent and no payment was taken. Registration opens once the form is connected.' }),
        el('a', { class: 'btn', href: '#overview', text: 'Back to overview' }),
      );
      form.replaceWith(panel);
      panel.focus();
    }

    form.append(el('p', { class: 'preview', text: 'Preview mode. This form is not connected yet, so nothing you enter is saved or sent.' }));
    const stepper = el('ol', { class: 'stepper' });
    config.steps.forEach((step, i) => stepper.append(el('li', {}, el('span', { text: i + 1 }), step.title)));
    form.append(stepper);

    config.steps.forEach((step, index) => {
      const node = el('fieldset', { class: 'fstep', hidden: index > 0 }, el('legend', { text: step.title }));
      const grid = el('div', { class: 'fields' });
      const repeats = [];
      step.items.forEach((item) => {
        if (item.repeat) {
          const block = renderRepeat(item);
          repeats.push(block);
          grid.append(block);
        } else {
          grid.append(renderField(item));
        }
      });
      const actions = el('div', { class: 'vactions' });
      actions.append(index ? el('button', { type: 'button', class: 'btn btn--ghost', 'data-back': true, text: 'Back' }) : el('span'));
      actions.append(el('button', { type: 'button', class: 'btn', 'data-next': true, text: step.next }));
      node.append(grid, actions);
      form.append(node);
      node.repeats = repeats;
    });

    form.addEventListener('input', ({ target }) => {
      if (!target.name || target.type === 'file') return;
      if (target.type === 'checkbox' && config.steps.some((s) => s.items.some((i) => i.n === target.name && i.t === 'multi'))) {
        values[target.name] = [...form.querySelectorAll(`[name="${target.name}"]:checked`)].map((box) => box.value);
      } else if (target.type === 'checkbox') {
        values[target.name] = target.checked;
      } else if (target.type !== 'radio' || target.checked) {
        values[target.name] = target.value;
      }
      save();
      refresh();
    });

    form.addEventListener('click', ({ target }) => {
      if (target.matches('[data-back]')) showStep(current - 1);
      if (!target.matches('[data-next]')) return;
      if (!validate(form.querySelectorAll('.fstep')[current])) return;
      if (current === config.steps.length - 1) finish();
      else showStep(current + 1);
    });

    form.addEventListener('submit', (event) => event.preventDefault());

    const aside = el('aside', { class: 'vaside' });
    config.aside.forEach((block) => {
      const card = el('div', { class: 'kit' }, el('h3', { text: block.h }));
      if (block.text) card.append(el('p', { class: 'kit__sub', text: block.text }));
      if (block.list) card.append(el('ul', {}, ...block.list.map((text) => el('li', { text }))));
      if (block.pairs) card.append(el('ul', {}, ...block.pairs.map(([title, text]) => el('li', {}, el('b', { text: title }), el('span', { text })))));
      aside.append(card);
    });
    aside.append(el('p', { class: 'note', text: 'Your answers are saved on this device as you type.' }));

    host.append(form, aside);
    form.querySelectorAll('.repeat').forEach((block) => block.draw());
    refresh();
    showStep(0);
  }

  document.querySelectorAll('[data-form]').forEach((host) => {
    buildForm(host, host.dataset.form, FORMS[host.dataset.form]);
  });
})();
