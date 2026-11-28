import { DASHBOARD_I18N } from '../../i18n/dashboard.i18n';

describe('Dashboard & Portal Content i18n and helpers', () => {
  const resolveDisplayName = (
    user: { displayName?: string | null; username?: string | null; email?: string | null } | null,
    defaultLabel = 'Colaborador'
  ): string => {
    const displayName = user?.displayName?.trim();
    if (displayName) return displayName;
    const username = user?.username?.trim();
    if (username) return username;
    return defaultLabel;
  };

  it('should use displayName when present including accents and compound names', () => {
    expect(resolveDisplayName({ displayName: 'Mónica Santillán', username: 'msantillan' })).toBe('Mónica Santillán');
    expect(resolveDisplayName({ displayName: 'José María López Pérez', username: 'jlopez' })).toBe('José María López Pérez');
  });

  it('should fallback to username when displayName is null, empty, or whitespace and never derive from email', () => {
    expect(resolveDisplayName({ displayName: null, username: 'msantillan', email: 'monica.santillan@rassini.com' })).toBe('msantillan');
    expect(resolveDisplayName({ displayName: '', username: 'msantillan', email: 'monica.santillan@rassini.com' })).toBe('msantillan');
    expect(resolveDisplayName({ displayName: '   ', username: 'msantillan', email: 'monica.santillan@rassini.com' })).toBe('msantillan');
    expect(resolveDisplayName({ displayName: null, username: null, email: 'monica.santillan@rassini.com' })).toBe('Colaborador');
  });

  it('should translate categories, types, statuses, and event labels in ES and EN', () => {
    expect(DASHBOARD_I18N['es-MX'].employee.dashboard.categories.SEGURIDAD).toBe('Seguridad');
    expect(DASHBOARD_I18N['en-US'].employee.dashboard.categories.SEGURIDAD).toBe('Safety');
    expect(DASHBOARD_I18N['en-US'].employee.dashboard.categories.PERSONAS).toBe('People');
    expect(DASHBOARD_I18N['en-US'].employee.dashboard.categories.NEGOCIO).toBe('Business');
    expect(DASHBOARD_I18N['en-US'].employee.dashboard.categories.CULTURA).toBe('Culture');

    expect(DASHBOARD_I18N['es-MX'].employee.dashboard.types.HERO_NEWS).toBe('Noticia principal');
    expect(DASHBOARD_I18N['en-US'].employee.dashboard.types.HERO_NEWS).toBe('Main news');
    expect(DASHBOARD_I18N['es-MX'].employee.dashboard.event.joinTeams).toBe('Unirse por Teams');
    expect(DASHBOARD_I18N['en-US'].employee.dashboard.event.joinTeams).toBe('Join on Teams');
    expect(DASHBOARD_I18N['es-MX'].employee.dashboard.event.addToCalendar).toBe('Agregar al calendario');
    expect(DASHBOARD_I18N['en-US'].employee.dashboard.event.addToCalendar).toBe('Add to calendar');
    expect(DASHBOARD_I18N['es-MX'].employee.dashboard.event.rsvpGoing).toBe('Sí, asistiré');
    expect(DASHBOARD_I18N['en-US'].employee.dashboard.event.rsvpGoing).toBe('Yes, I will attend');
  });
});
